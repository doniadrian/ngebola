import "server-only";
import { and, asc, count, desc, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, checkins, clubs, disputeEvidence, disputes, matches, moderationFlags, resultConfirmations, reviews, scoreEntries, squadMemberships } from "@/db/schema";
import { JAM, MENIT } from "@/lib/waktu";
import { saringKataKasar } from "./chat";
import { clubMilik } from "./club";
import { tandaiKonflik, type EventSkor } from "./domain/skor";
import { lawanDari, peserta, pesanSistem } from "./match";
import { beritahu, idAdminPlatform } from "./notify";
import { terapkanRating } from "./rating";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Match = typeof matches.$inferSelect;
type Hasil<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export const BUKA_CHECKIN_MS = 60 * MENIT;
export const TOLERANSI_WO_MS = 20 * MENIT;
export const TENGGAT_HASIL_MS = 48 * JAM;
export const TENGGAT_BUKTI_MS = 48 * JAM;
export const SKOR_WO = 3;

const ambil = (tx: Tx | typeof db, id: string) => tx.select().from(matches).where(eq(matches.id, id)).get();
const nama = (clubId: string | null) => (clubId ? (db.select({ name: clubs.name }).from(clubs).where(eq(clubs.id, clubId)).get()?.name ?? "Club") : "Club");
const admin = (clubId: string | null) => (clubId ? db.select({ id: clubs.adminUserId }).from(clubs).where(eq(clubs.id, clubId)).get()?.id : undefined);
const adminKedua = (m: Match) => [admin(m.creatorClubId), admin(m.opponentClubId)].filter(Boolean) as string[];
const pemainKedua = (m: Match) =>
  db.select({ id: squadMemberships.playerUserId }).from(squadMemberships).where(and(inArray(squadMemberships.clubId, [m.creatorClubId, m.opponentClubId!]), eq(squadMemberships.status, "aktif"))).all().map((r) => r.id);
const teksSkor = (m: Match, a: number, b: number) => `${nama(m.creatorClubId)} ${a}–${b} ${nama(m.opponentClubId)}`;

export const checkInDibuka = (m: Pick<Match, "scheduledAt">, now = new Date()) => !!m.scheduledAt && now.getTime() >= m.scheduledAt.getTime() - BUKA_CHECKIN_MS;
export const sudahCheckIn = (matchId: string) => db.select().from(checkins).where(eq(checkins.matchId, matchId)).all();

// ── Check-in & mulai (D-01, W-01) ───────────────────────────────────────────

export async function checkIn(adminId: string, matchId: string, lokasi: { lat: number; lng: number } | null, now = new Date()): Promise<Hasil> {
  const club = clubMilik(adminId);
  const m = ambil(db, matchId);
  if (!club || !m || !peserta(m, club.id) || m.status !== "terkonfirmasi") return { ok: false, error: "Check-in tidak tersedia untuk match ini." };
  if (!checkInDibuka(m, now)) return { ok: false, error: "Check-in dibuka 60 menit sebelum kick-off." };
  if (now.getTime() > m.scheduledAt!.getTime() + TOLERANSI_WO_MS) return { ok: false, error: "Toleransi 20 menit sudah lewat." };
  const sahLokasi = lokasi && Math.abs(lokasi.lat) <= 90 && Math.abs(lokasi.lng) <= 180 ? lokasi : null;
  const r = db.insert(checkins).values({ matchId, clubId: club.id, checkedInAt: now, lat: sahLokasi?.lat ?? null, lng: sahLokasi?.lng ?? null, byUserId: adminId }).onConflictDoNothing().run();
  if (r.changes === 0) return { ok: false, error: "Club kamu sudah check-in." };
  pesanSistem(db, matchId, `${club.name} sudah check-in di lokasi.`, now);
  const lawan = admin(lawanDari(m, club.id));
  if (lawan) await beritahu([lawan], { trigger: "check_in", title: `${club.name} sudah check-in`, url: `/club/match/${matchId}` });
  return { ok: true };
}

/** Mulai babak pertama. Admin yang menekan lebih dulu menjadi satu-satunya pencatat aktif. */
export function mulaiMatch(adminId: string, matchId: string, now = new Date()): Hasil {
  const club = clubMilik(adminId);
  const m = ambil(db, matchId);
  if (!club || !m || !peserta(m, club.id) || m.status !== "terkonfirmasi") return { ok: false, error: "Match tidak bisa dimulai." };
  if (sudahCheckIn(matchId).length < 2) return { ok: false, error: "Kedua club harus check-in dulu." };
  const ok = db.transaction((tx) => {
    const r = tx.update(matches).set({ status: "berlangsung", scorerClubId: club.id, startedAt: now, updatedAt: now }).where(and(eq(matches.id, matchId), eq(matches.status, "terkonfirmasi"))).run();
    if (r.changes !== 1) return false;
    tx.insert(scoreEntries).values({ matchId, half: 1, creatorScore: 0, opponentScore: 0, event: "mulai", recordedBy: adminId, clientEntryId: crypto.randomUUID(), recordedAt: now, syncedAt: now }).run();
    pesanSistem(tx, matchId, `Kick-off! Pencatat skor: ${club.name}.`, now);
    return true;
  });
  return ok ? { ok: true } : { ok: false, error: "Match sudah dimulai oleh club lawan." };
}

// ── Pencatatan skor & sinkron offline (D-02, D-03) ──────────────────────────

export type EntriKlien = { clientEntryId: string; half: number; creatorScore: number; opponentScore: number; event: EventSkor; recordedAt: string };

export function catatanSkor(matchId: string) {
  return db.select().from(scoreEntries).where(eq(scoreEntries.matchId, matchId)).orderBy(asc(scoreEntries.recordedAt)).all();
}

/**
 * Terima catatan dari pencatat (bisa dikirim ulang/terlambat). Idempoten lewat clientEntryId.
 * Catatan yang tidak cocok urutannya ditandai konflik untuk ditinjau manual. Event "selesai" menutup match.
 */
export async function sinkronSkor(adminId: string, matchId: string, entri: EntriKlien[], now = new Date()): Promise<Hasil<{ diterima: number; konflik: number }>> {
  const club = clubMilik(adminId);
  const m = ambil(db, matchId);
  if (!club || !m || m.scorerClubId !== club.id) return { ok: false, error: "Hanya pencatat aktif yang bisa mencatat skor." };
  if (!["berlangsung", "menunggu_hasil", "sengketa", "selesai"].includes(m.status)) return { ok: false, error: "Match belum dimulai." };
  const sudah = new Set(catatanSkor(matchId).map((c) => c.clientEntryId));
  const baru = entri
    .filter((e) => typeof e.clientEntryId === "string" && e.clientEntryId.length <= 64 && !sudah.has(e.clientEntryId))
    .map((e) => ({ ...e, recordedAt: new Date(e.recordedAt), half: Number(e.half), creatorScore: Number(e.creatorScore), opponentScore: Number(e.opponentScore) }))
    .filter((e) => !Number.isNaN(e.recordedAt.getTime()) && ["mulai", "skor", "jeda", "akhir_babak", "selesai"].includes(e.event))
    // Jam perangkat tidak boleh jauh di depan server.
    .map((e) => ({ ...e, recordedAt: e.recordedAt > new Date(now.getTime() + 5 * MENIT) ? now : e.recordedAt }));
  if (!baru.length) return { ok: true, diterima: 0, konflik: 0 };

  const lama = catatanSkor(matchId).map((c) => ({ ...c, conflict: c.conflict }));
  const ditandai = m.status === "berlangsung" ? tandaiKonflik(lama, baru) : baru.map((b) => ({ ...b, conflict: true }));
  const selesai = ditandai.find((d) => !d.conflict && d.event === "selesai");

  db.transaction((tx) => {
    for (const d of ditandai) {
      tx.insert(scoreEntries)
        .values({ matchId, half: d.half, creatorScore: d.creatorScore, opponentScore: d.opponentScore, event: d.event, recordedBy: adminId, clientEntryId: d.clientEntryId, recordedAt: d.recordedAt, syncedAt: now, conflict: d.conflict })
        .onConflictDoNothing()
        .run();
    }
    if (ditandai.some((d) => d.conflict)) pesanSistem(tx, matchId, "Ada catatan skor yang bentrok saat sinkron. Ditandai untuk ditinjau; skor akhir dikonfirmasi kedua club.", now);
    if (selesai) akhiriMatch(tx, m, selesai.creatorScore, selesai.opponentScore, now);
  });
  if (selesai) {
    const lawan = admin(lawanDari(m, club.id));
    if (lawan) await beritahu([lawan], { trigger: "konfirmasi_hasil", title: "Konfirmasi hasil match", body: `${teksSkor(m, selesai.creatorScore, selesai.opponentScore)}. Tenggat 48 jam.`, url: `/club/match/${matchId}` });
  }
  return { ok: true, diterima: ditandai.filter((d) => !d.conflict).length, konflik: ditandai.filter((d) => d.conflict).length };
}

/** Peluit akhir: Menunggu Konfirmasi Hasil, pengusul = club pencatat (H-05). */
function akhiriMatch(tx: Tx, m: Match, a: number, b: number, now: Date) {
  const r = tx.update(matches).set({ status: "menunggu_hasil", endedAt: now, updatedAt: now }).where(and(eq(matches.id, m.id), eq(matches.status, "berlangsung"))).run();
  if (r.changes !== 1) return;
  tx.insert(resultConfirmations).values({ matchId: m.id, proposerClubId: m.scorerClubId!, creatorScore: a, opponentScore: b, proposedAt: now, deadline: new Date(now.getTime() + TENGGAT_HASIL_MS) }).onConflictDoNothing().run();
  pesanSistem(tx, m.id, `Peluit akhir: ${teksSkor(m, a, b)}. ${nama(lawanDari(m, m.scorerClubId!))} punya 48 jam untuk mengonfirmasi.`, now);
}

/** Selesai: simpan skor resmi, perbarui rating & head-to-head (H-03). */
function selesaikan(tx: Tx, matchId: string, a: number, b: number, now: Date, catatan: string) {
  tx.update(matches).set({ status: "selesai", finalCreatorScore: a, finalOpponentScore: b, updatedAt: now }).where(eq(matches.id, matchId)).run();
  terapkanRating(tx, matchId, now);
  pesanSistem(tx, matchId, catatan, now);
}

async function kabarSelesai(m: Match, a: number, b: number) {
  await beritahu(adminKedua(m), { trigger: "hasil_resmi", title: "Hasil resmi & rating diperbarui", body: teksSkor(m, a, b), url: `/club/match/${m.id}` });
  await beritahu(pemainKedua(m), { trigger: "hasil_match", title: "Hasil match", body: teksSkor(m, a, b), url: `/pemain/match/${m.id}` });
}

// ── Konfirmasi hasil & sengketa (H-01, H-02, H-05, 9.2) ─────────────────────

export const hasilMatch = (matchId: string) => db.select().from(resultConfirmations).where(eq(resultConfirmations.matchId, matchId)).get() ?? null;

export async function konfirmasiHasil(adminId: string, matchId: string, respon: { setuju: true } | { setuju: false; skorPembuat: number; skorLawan: number }, now = new Date()): Promise<Hasil> {
  const club = clubMilik(adminId);
  const m = ambil(db, matchId);
  const rc = hasilMatch(matchId);
  if (!club || !m || !rc || !peserta(m, club.id) || m.status !== "menunggu_hasil") return { ok: false, error: "Tidak ada hasil yang perlu dikonfirmasi." };
  if (rc.proposerClubId === club.id) return { ok: false, error: "Hasil dikonfirmasi oleh club lawan." };
  if (rc.response || rc.deadline < now) return { ok: false, error: "Tenggat konfirmasi sudah lewat." };

  if (respon.setuju) {
    db.transaction((tx) => {
      tx.update(resultConfirmations).set({ response: "setuju", respondedAt: now }).where(eq(resultConfirmations.id, rc.id)).run();
      selesaikan(tx, matchId, rc.creatorScore, rc.opponentScore, now, `${club.name} mengonfirmasi hasil. Hasil resmi: ${teksSkor(m, rc.creatorScore, rc.opponentScore)}.`);
    });
    await kabarSelesai(m, rc.creatorScore, rc.opponentScore);
    return { ok: true };
  }

  const { skorPembuat: a, skorLawan: b } = respon;
  if (![a, b].every((x) => Number.isInteger(x) && x >= 0 && x <= 99)) return { ok: false, error: "Skor tidak valid." };
  if (a === rc.creatorScore && b === rc.opponentScore) return { ok: false, error: "Skor sama dengan usulan. Pilih Setuju." };
  db.transaction((tx) => {
    tx.update(resultConfirmations).set({ response: "sanggah", counterCreatorScore: a, counterOpponentScore: b, respondedAt: now }).where(eq(resultConfirmations.id, rc.id)).run();
    tx.update(matches).set({ status: "sengketa", updatedAt: now }).where(eq(matches.id, matchId)).run();
    tx.insert(disputes).values({ matchId, openedAt: now, evidenceDeadline: new Date(now.getTime() + TENGGAT_BUKTI_MS) }).onConflictDoNothing().run();
    pesanSistem(tx, matchId, `${club.name} menyanggah: ${teksSkor(m, a, b)}. Sengketa dibuka; kedua club punya 48 jam untuk melampirkan bukti.`, now);
  });
  await beritahu(adminKedua(m), { trigger: "sengketa", title: "Sengketa hasil dibuka", body: "Lampirkan bukti dalam 48 jam.", url: `/club/match/${matchId}` }, { email: true });
  await beritahu(idAdminPlatform(), { trigger: "sengketa", title: `Sengketa baru: ${nama(m.creatorClubId)} vs ${nama(m.opponentClubId)}`, url: `/platform/sengketa/${matchId}` });
  return { ok: true };
}

export const sengketaMatch = (matchId: string) => db.select().from(disputes).where(eq(disputes.matchId, matchId)).get() ?? null;
export const buktiSengketa = (disputeId: string) => db.select().from(disputeEvidence).where(eq(disputeEvidence.disputeId, disputeId)).orderBy(asc(disputeEvidence.createdAt)).all();

/** Bukti berupa tautan + catatan (PLAN.md butir 8), dalam 48 jam sejak sengketa dibuka. */
export function tambahBukti(adminId: string, matchId: string, input: { catatan: string; url: string | null }, now = new Date()): Hasil {
  const club = clubMilik(adminId);
  const m = ambil(db, matchId);
  const d = sengketaMatch(matchId);
  if (!club || !m || !d || !peserta(m, club.id) || m.status !== "sengketa" || d.decidedAt) return { ok: false, error: "Sengketa tidak ditemukan." };
  if (d.evidenceDeadline < now) return { ok: false, error: "Tenggat bukti 48 jam sudah lewat." };
  if (input.catatan.trim().length < 5) return { ok: false, error: "Tulis penjelasan singkat." };
  if (input.url && !/^https?:\/\/\S+$/i.test(input.url)) return { ok: false, error: "Tautan harus diawali http:// atau https://" };
  db.insert(disputeEvidence).values({ disputeId: d.id, clubId: club.id, note: saringKataKasar(input.catatan.trim()).slice(0, 1000), url: input.url, createdAt: now }).run();
  pesanSistem(db, matchId, `${club.name} melampirkan bukti sengketa.`, now);
  return { ok: true };
}

export type Keputusan = "pengusul" | "penyanggah" | "koreksi" | "batal";

/** Keputusan Admin platform (9.3); wajib alasan, tercatat di audit, sengketa kembali ke Selesai. */
export async function putuskanSengketa(platformUserId: string | null, matchId: string, input: { keputusan: Keputusan; skor?: [number, number]; alasan: string }, now = new Date()): Promise<Hasil> {
  const m = ambil(db, matchId);
  const d = sengketaMatch(matchId);
  const rc = hasilMatch(matchId);
  if (!m || !d || !rc || m.status !== "sengketa" || d.decidedAt) return { ok: false, error: "Sengketa tidak ditemukan atau sudah diputus." };
  if (input.alasan.trim().length < 10) return { ok: false, error: "Tulis alasan keputusan minimal 10 karakter." };
  const skor: [number, number] | null =
    input.keputusan === "pengusul" ? [rc.creatorScore, rc.opponentScore] : input.keputusan === "penyanggah" ? [rc.counterCreatorScore!, rc.counterOpponentScore!] : input.keputusan === "koreksi" ? (input.skor ?? null) : null;
  if (input.keputusan === "koreksi" && !(skor && skor.every((x) => Number.isInteger(x) && x >= 0 && x <= 99))) return { ok: false, error: "Isi skor koreksi." };

  db.transaction((tx) => {
    tx.update(disputes)
      .set({ decision: input.keputusan, finalCreatorScore: skor?.[0] ?? null, finalOpponentScore: skor?.[1] ?? null, reason: input.alasan.trim(), decidedBy: platformUserId, decidedAt: now })
      .where(eq(disputes.id, d.id))
      .run();
    if (skor) selesaikan(tx, matchId, skor[0], skor[1], now, `Keputusan sengketa: ${teksSkor(m, skor[0], skor[1])}. Alasan: ${input.alasan.trim()}`);
    else {
      tx.update(matches).set({ status: "selesai", excludedFromRating: true, finalCreatorScore: null, finalOpponentScore: null, updatedAt: now }).where(eq(matches.id, matchId)).run();
      pesanSistem(tx, matchId, `Keputusan sengketa: match dibatalkan dari catatan, tanpa pembaruan rating. Alasan: ${input.alasan.trim()}`, now);
    }
    tx.insert(auditLogs).values({ actorUserId: platformUserId, action: `putus_sengketa_${input.keputusan}`, targetType: "match", targetId: matchId, reason: input.alasan.trim(), detail: skor ? `${skor[0]}-${skor[1]}` : null, createdAt: now }).run();
  });
  await beritahu(adminKedua(m), { trigger: "keputusan_sengketa", title: "Keputusan sengketa", body: input.alasan.trim(), url: `/club/match/${matchId}` }, { email: true });
  if (skor) await beritahu(pemainKedua(m), { trigger: "hasil_match", title: "Hasil match", body: teksSkor(m, skor[0], skor[1]), url: `/pemain/match/${matchId}` });
  return { ok: true };
}

// ── Penilaian (H-06, 7.3) ───────────────────────────────────────────────────

export function beriPenilaian(adminId: string, matchId: string, input: { sportivitas: number; kerapian: number; komentar: string | null }, now = new Date()): Hasil {
  const club = clubMilik(adminId);
  const m = ambil(db, matchId);
  if (!club || !m || !peserta(m, club.id) || m.status !== "selesai" || m.finalCreatorScore == null) return { ok: false, error: "Penilaian hanya untuk match yang selesai." };
  if (![input.sportivitas, input.kerapian].every((x) => Number.isInteger(x) && x >= 1 && x <= 5)) return { ok: false, error: "Nilai 1 sampai 5." };
  const r = db
    .insert(reviews)
    .values({ matchId, reviewerClubId: club.id, reviewedClubId: lawanDari(m, club.id)!, sportsmanship: input.sportivitas, tidiness: input.kerapian, comment: input.komentar ? saringKataKasar(input.komentar.trim()).slice(0, 200) : null, createdAt: now })
    .onConflictDoNothing()
    .run();
  if (!r.changes) return { ok: false, error: "Club kamu sudah memberi penilaian." };
  periksaPolaPenilaian(club.id, lawanDari(m, club.id)!, now);
  return { ok: true };
}

/**
 * Anti-manipulasi penilaian (PRD 7.4): bintang 5 timbal balik antar pasangan yang sama ≥ 3 match dalam 60 hari, atau
 * ≥ 3 dari 5 penilaian terakhir satu club bernilai 1 → penilaian itu dikecualikan dari rata-rata & ditandai.
 */
function periksaPolaPenilaian(dari: string, ke: string, now: Date) {
  const sejak = new Date(now.getTime() - 60 * 24 * JAM);
  const pasangan = db
    .select()
    .from(reviews)
    .where(and(gt(reviews.createdAt, sejak), or(and(eq(reviews.reviewerClubId, dari), eq(reviews.reviewedClubId, ke)), and(eq(reviews.reviewerClubId, ke), eq(reviews.reviewedClubId, dari)))))
    .all();
  const perMatch = new Map<string, typeof pasangan>();
  for (const r of pasangan) perMatch.set(r.matchId, [...(perMatch.get(r.matchId) ?? []), r]);
  const timbalBalik = [...perMatch.values()].filter((rs) => rs.length === 2 && rs.every((r) => r.sportsmanship === 5));
  if (timbalBalik.length >= 3) {
    db.update(reviews).set({ excluded: true }).where(inArray(reviews.id, timbalBalik.flat().map((r) => r.id))).run();
    db.insert(moderationFlags).values({ kind: "ulasan_pola", clubId: dari, otherClubId: ke, detail: `Bintang 5 timbal balik di ${timbalBalik.length} match dalam 60 hari; penilaian dikecualikan.`, createdAt: now }).run();
  }

  const terakhir = db.select().from(reviews).where(eq(reviews.reviewerClubId, dari)).orderBy(desc(reviews.createdAt)).limit(5).all();
  const satu = terakhir.filter((r) => r.sportsmanship === 1);
  if (satu.length >= 3 && satu.some((r) => !r.excluded)) {
    db.update(reviews).set({ excluded: true }).where(inArray(reviews.id, satu.map((r) => r.id))).run();
    db.insert(moderationFlags).values({ kind: "ulasan_pola", clubId: dari, detail: `${satu.length} dari 5 penilaian terakhir bernilai 1; penilaian dikecualikan.`, createdAt: now }).run();
  }
}

/** Penilaian saling tersembunyi sampai keduanya mengisi atau 7 hari berlalu; penilaian sendiri selalu terlihat. */
export function penilaianMatch(matchId: string, viewerClubId: string | null, now = new Date()) {
  const m = ambil(db, matchId);
  const semua = db.select().from(reviews).where(eq(reviews.matchId, matchId)).all();
  const terbuka = semua.length >= 2 || (!!m?.endedAt && now.getTime() - (m.endedAt ?? m.updatedAt).getTime() >= 7 * 24 * JAM);
  return { terbuka, daftar: semua.filter((r) => terbuka || r.reviewerClubId === viewerClubId), sudahSaya: semua.some((r) => r.reviewerClubId === viewerClubId) };
}

// ── Tenggat hari H (D-06, H-05, 11.2) ───────────────────────────────────────

export async function prosesTenggatHariH(now = new Date()) {
  const kabar: (() => Promise<void>)[] = [];

  // WO: lewat 20 menit setelah kick-off & hanya satu club check-in. Tidak ada yang check-in → dibatalkan, keduanya penalti.
  const lewat = db.select().from(matches).where(and(eq(matches.status, "terkonfirmasi"), lt(matches.scheduledAt, new Date(now.getTime() - TOLERANSI_WO_MS)))).all();
  for (const m of lewat) {
    const hadir = sudahCheckIn(m.id);
    if (hadir.length === 1) {
      const menang = hadir[0].clubId;
      const [a, b] = menang === m.creatorClubId ? [SKOR_WO, 0] : [0, SKOR_WO];
      db.transaction((tx) => {
        tx.update(matches).set({ status: "wo", woWinnerClubId: menang, finalCreatorScore: a, finalOpponentScore: b, excludedFromRating: true, endedAt: now, updatedAt: now }).where(and(eq(matches.id, m.id), eq(matches.status, "terkonfirmasi"))).run();
        pesanSistem(tx, m.id, `WO: hanya ${nama(menang)} check-in sampai 20 menit setelah kick-off. Kemenangan administratif 3-0, tidak mengubah rating.`, now);
      });
      kabar.push(() => beritahu(adminKedua(m), { trigger: "wo", title: `WO: ${nama(menang)} menang administratif`, url: `/club/match/${m.id}` }));
    } else if (hadir.length === 0) {
      db.transaction((tx) => {
        tx.update(matches).set({ status: "dibatalkan", cancelReason: "tidak_hadir", cancelNote: "Kedua club tidak check-in.", lateCancel: true, cancelledByClubId: null, updatedAt: now }).where(and(eq(matches.id, m.id), eq(matches.status, "terkonfirmasi"))).run();
        pesanSistem(tx, m.id, "Kedua club tidak check-in. Match dibatalkan tanpa pemenang; keandalan keduanya turun.", now);
      });
      kabar.push(() => beritahu(adminKedua(m), { trigger: "tidak_hadir", title: "Match dibatalkan: kedua club tidak hadir", url: `/club/match/${m.id}` }));
    }
  }

  // Tanpa respons 48 jam → skor pengusul sah.
  const tunggu = db
    .select({ m: matches, rc: resultConfirmations })
    .from(matches)
    .innerJoin(resultConfirmations, eq(resultConfirmations.matchId, matches.id))
    .where(and(eq(matches.status, "menunggu_hasil"), isNull(resultConfirmations.response), lt(resultConfirmations.deadline, now)))
    .all();
  for (const { m, rc } of tunggu) {
    db.transaction((tx) => selesaikan(tx, m.id, rc.creatorScore, rc.opponentScore, now, `Tanpa respons 48 jam: skor pengusul sah. Hasil resmi: ${teksSkor(m, rc.creatorScore, rc.opponentScore)}.`));
    kabar.push(() => kabarSelesai(m, rc.creatorScore, rc.opponentScore));
  }

  // Penyanggah tanpa bukti dalam 48 jam → skor pengusul disahkan.
  const sengketa = db
    .select({ m: matches, d: disputes, rc: resultConfirmations })
    .from(disputes)
    .innerJoin(matches, eq(matches.id, disputes.matchId))
    .innerJoin(resultConfirmations, eq(resultConfirmations.matchId, matches.id))
    .where(and(eq(matches.status, "sengketa"), isNull(disputes.decidedAt), lt(disputes.evidenceDeadline, now)))
    .all();
  for (const { m, d, rc } of sengketa) {
    const penyanggah = lawanDari(m, rc.proposerClubId);
    const [{ n }] = db.select({ n: count() }).from(disputeEvidence).where(and(eq(disputeEvidence.disputeId, d.id), eq(disputeEvidence.clubId, penyanggah!))).all();
    if (n === 0) kabar.push(async () => void (await putuskanSengketa(null, m.id, { keputusan: "pengusul", alasan: "Penyanggah tidak melampirkan bukti dalam 48 jam." }, now)));
  }

  for (const k of kabar) await k();
  return { wo: lewat.length, hasil: tunggu.length, sengketa: sengketa.length };
}

