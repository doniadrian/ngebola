import "server-only";
import { and, count, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, clubBlocks, clubs, matchChangeRequests, matches, matchReadiness, platformSettings, scheduleProposals, squadMemberships, venues } from "@/db/schema";
import { LABEL_ALASAN_BATAL, LABEL_FORMAT, type Format } from "@/db/enums";
import type { InputUsulan, Lapangan } from "@/lib/form-match";
import { formatJadwal, HARI, JAM } from "@/lib/waktu";
import { bolehBertanding, clubMilik } from "./club";
import { beritahu } from "./notify";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Match = typeof matches.$inferSelect;
type Hasil<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export const MAKS_PUTARAN = 3;
export const TENGGAT_RESPONS_MS = 72 * JAM;
export const BATAS_BATAL_MENDADAK_MS = 24 * JAM;
export const MASA_TUNDA_MS = 14 * HARI;
export const STATUS_PRA = ["draf", "terbuka", "ditantang", "dinegosiasi"] as const;
export const STATUS_AKTIF_TANTANGAN = ["ditantang", "dinegosiasi"] as const;

export const pesanSistem = (tx: Tx | typeof db, matchId: string, body: string, now = new Date()) =>
  tx.insert(chatMessages).values({ matchId, kind: "sistem", body, createdAt: now }).run();

/** Tenggat respons: 72 jam, atau 24 jam sebelum opsi paling awal bila lebih dekat (PRD 6, 10.1). */
export function tenggatRespons(now: Date, opsi: Date[]) {
  const awal = Math.min(...opsi.map((o) => o.getTime()));
  return new Date(Math.max(now.getTime() + JAM, Math.min(now.getTime() + TENGGAT_RESPONS_MS, awal - 24 * JAM)));
}

export function maksMatchTerbuka() {
  const v = Number(db.select().from(platformSettings).where(eq(platformSettings.key, "match.maks_terbuka")).get()?.value);
  return Number.isInteger(v) && v > 0 ? v : 3;
}

const ambil = (tx: Tx | typeof db, id: string) => tx.select().from(matches).where(eq(matches.id, id)).get();

/** Usulan terbaru (putaran tertinggi) yang masih menunggu. */
export function usulanTerbaru(tx: Tx | typeof db, matchId: string) {
  const semua = tx.select().from(scheduleProposals).where(eq(scheduleProposals.matchId, matchId)).orderBy(desc(scheduleProposals.round)).all();
  const putaran = semua[0]?.round ?? 0;
  return semua.filter((p) => p.round === putaran);
}

/** Club yang wajib merespons ajakan/tawaran sekarang. */
export function pihakMenunggu(m: Match, usulan: { proposedByClubId: string }[]): string | null {
  if (m.status === "ditantang") return m.opponentClubId;
  if (m.status === "dinegosiasi") {
    const pengusul = usulan[0]?.proposedByClubId;
    return pengusul === m.creatorClubId ? m.opponentClubId : m.creatorClubId;
  }
  return null;
}

export const peserta = (m: Match, clubId: string) => m.creatorClubId === clubId || m.opponentClubId === clubId;
export const lawanDari = (m: Match, clubId: string) => (m.creatorClubId === clubId ? m.opponentClubId : m.creatorClubId);

function clubSiap(adminId: string): Hasil<{ club: NonNullable<ReturnType<typeof clubMilik>> }> {
  const club = clubMilik(adminId);
  if (!club) return { ok: false, error: "Daftarkan club dulu." };
  if (!bolehBertanding(club)) return { ok: false, error: club.suspendedAt ? "Club sedang ditangguhkan." : "Club belum disetujui Admin platform." };
  return { ok: true, club };
}

export function salingBlokir(a: string, b: string) {
  return !!db
    .select({ x: clubBlocks.blockerClubId })
    .from(clubBlocks)
    .where(or(and(eq(clubBlocks.blockerClubId, a), eq(clubBlocks.blockedClubId, b)), and(eq(clubBlocks.blockerClubId, b), eq(clubBlocks.blockedClubId, a))))
    .get();
}

function cekLapangan(l: Lapangan, format: Format): string | null {
  if (!l.venueId) return null;
  const v = db.select().from(venues).where(eq(venues.id, l.venueId)).get();
  if (!v) return "Lapangan tidak ditemukan.";
  if (format === "football" ? !v.forFootball : !v.forMini) return `${v.name} tidak untuk ${LABEL_FORMAT[format]}.`;
  return null;
}

function namaLapangan(l: { venueId: string | null; manualName: string | null }) {
  if (l.venueId) return db.select({ name: venues.name }).from(venues).where(eq(venues.id, l.venueId)).get()?.name ?? "lapangan";
  return l.manualName ? `${l.manualName} (belum terverifikasi)` : "lapangan menyusul";
}

const idAdmin = (clubId: string | null) => (clubId ? db.select({ id: clubs.adminUserId }).from(clubs).where(eq(clubs.id, clubId)).get()?.id : undefined);
const anggotaAktif = (clubIds: string[]) =>
  db.select({ id: squadMemberships.playerUserId }).from(squadMemberships).where(and(inArray(squadMemberships.clubId, clubIds), eq(squadMemberships.status, "aktif"))).all().map((r) => r.id);

function sisipkanUsulan(tx: Tx, matchId: string, round: number, clubId: string, u: InputUsulan, now: Date) {
  for (const startsAt of u.opsi) {
    tx.insert(scheduleProposals)
      .values({ matchId, round, proposedByClubId: clubId, startsAt, venueId: u.lapangan.venueId, manualVenueName: u.lapangan.manualName, manualVenueAddress: u.lapangan.manualAddress, feeTotal: u.feeTotal, status: "menunggu", createdAt: now })
      .run();
  }
}

// ── Membuat match ───────────────────────────────────────────────────────────

export async function buatMatch(
  adminId: string,
  input: { jenis: "terbuka" | "tantangan"; lawanClubId?: string; format: Format; area?: Match["area"]; level?: Match["level"]; usulan: InputUsulan; rematchOf?: string },
  now = new Date(),
): Promise<Hasil<{ matchId: string }>> {
  const s = clubSiap(adminId);
  if (!s.ok) return s;
  const { club } = s;
  const eLap = cekLapangan(input.usulan.lapangan, input.format);
  if (eLap) return { ok: false, error: eLap };

  if (input.jenis === "terbuka") {
    const [{ n }] = db.select({ n: count() }).from(matches).where(and(eq(matches.creatorClubId, club.id), eq(matches.status, "terbuka"))).all();
    if (n >= maksMatchTerbuka()) return { ok: false, error: `Maksimal ${maksMatchTerbuka()} match terbuka aktif. Tutup salah satu dulu.` };
  } else {
    const lawan = input.lawanClubId ? db.select().from(clubs).where(eq(clubs.id, input.lawanClubId)).get() : undefined;
    if (!lawan || lawan.id === club.id || !bolehBertanding(lawan)) return { ok: false, error: "Club lawan tidak bisa ditantang." };
    if (salingBlokir(club.id, lawan.id)) return { ok: false, error: "Tidak bisa menantang club ini." };
    const aktif = db
      .select({ id: matches.id })
      .from(matches)
      .where(
        and(
          inArray(matches.status, [...STATUS_AKTIF_TANTANGAN]),
          or(and(eq(matches.creatorClubId, club.id), eq(matches.opponentClubId, lawan.id)), and(eq(matches.creatorClubId, lawan.id), eq(matches.opponentClubId, club.id))),
        ),
      )
      .get();
    if (aktif) return { ok: false, error: `Masih ada tantangan aktif dengan ${lawan.name}. Ubah atau selesaikan yang itu dulu.` };
  }

  const id = crypto.randomUUID();
  db.transaction((tx) => {
    tx.insert(matches)
      .values({
        id,
        type: input.jenis,
        format: input.format,
        status: input.jenis === "terbuka" ? "terbuka" : "ditantang",
        creatorClubId: club.id,
        opponentClubId: input.jenis === "tantangan" ? input.lawanClubId! : null,
        area: input.area ?? club.area,
        level: input.level ?? club.level,
        feeTotal: input.usulan.feeTotal,
        notes: input.usulan.pesan,
        responseDeadline: input.jenis === "tantangan" ? tenggatRespons(now, input.usulan.opsi) : null,
        rematchOf: input.rematchOf ?? null,
        createdBy: adminId,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    sisipkanUsulan(tx, id, 0, club.id, input.usulan, now);
  });

  if (input.jenis === "tantangan") {
    await beritahu([idAdmin(input.lawanClubId!)!], { trigger: "tantangan_baru", title: `${club.name} menantang club kamu`, body: `${LABEL_FORMAT[input.format]} · ${input.usulan.opsi.map(formatJadwal).join(" / ")}`, url: `/club/match/${id}` });
  }
  return { ok: true, matchId: id };
}

export async function terbitkanDraf(adminId: string, matchId: string, now = new Date()): Promise<Hasil> {
  const s = clubSiap(adminId);
  if (!s.ok) return s;
  const m = ambil(db, matchId);
  if (!m || m.status !== "draf" || m.creatorClubId !== s.club.id) return { ok: false, error: "Draf tidak ditemukan." };
  const [{ n }] = db.select({ n: count() }).from(matches).where(and(eq(matches.creatorClubId, s.club.id), eq(matches.status, "terbuka"))).all();
  if (n >= maksMatchTerbuka()) return { ok: false, error: `Maksimal ${maksMatchTerbuka()} match terbuka aktif.` };
  const masaDepan = usulanTerbaru(db, matchId).filter((p) => p.startsAt.getTime() > now.getTime() + 24 * JAM);
  if (!masaDepan.length) return { ok: false, error: "Semua opsi jadwal sudah terlalu dekat. Buat match baru." };
  db.update(matches).set({ status: "terbuka", updatedAt: now }).where(eq(matches.id, matchId)).run();
  return { ok: true };
}

export function hapusDraf(adminId: string, matchId: string): Hasil {
  const club = clubMilik(adminId);
  const m = ambil(db, matchId);
  if (!club || !m || m.status !== "draf" || m.creatorClubId !== club.id) return { ok: false, error: "Draf tidak ditemukan." };
  db.transaction((tx) => {
    tx.delete(scheduleProposals).where(eq(scheduleProposals.matchId, matchId)).run();
    tx.delete(matches).where(eq(matches.id, matchId)).run();
  });
  return { ok: true };
}

// ── Merespons ajakan ────────────────────────────────────────────────────────

/** Terima satu opsi: match terbuka (club lain) atau tantangan/tawaran yang menunggu respons club ini (S-01). */
export async function terimaUsulan(adminId: string, matchId: string, proposalId: string, now = new Date()): Promise<Hasil> {
  const s = clubSiap(adminId);
  if (!s.ok) return s;
  const { club } = s;
  const m = ambil(db, matchId);
  if (!m) return { ok: false, error: "Match tidak ditemukan." };
  const usulan = usulanTerbaru(db, matchId);
  const p = usulan.find((u) => u.id === proposalId && u.status === "menunggu");
  if (!p) return { ok: false, error: "Opsi jadwal tidak tersedia lagi." };
  if (p.startsAt.getTime() <= now.getTime() + 2 * JAM) return { ok: false, error: "Opsi ini terlalu dekat dengan jadwal main." };
  if (!p.venueId && !p.manualVenueName) return { ok: false, error: "Opsi ini belum ada lapangannya. Tawar balik dengan lapangan." };

  const terbuka = m.status === "terbuka" && m.type === "terbuka" && m.creatorClubId !== club.id;
  if (terbuka && salingBlokir(club.id, m.creatorClubId)) return { ok: false, error: "Match ini tidak tersedia." };
  if (!terbuka && pihakMenunggu(m, usulan) !== club.id) return { ok: false, error: "Bukan giliran club kamu untuk merespons." };
  if (!terbuka && m.responseDeadline && m.responseDeadline < now) return { ok: false, error: "Tenggat respons sudah lewat." };

  const berhasil = db.transaction((tx) => {
    // Hanya berhasil bila status belum berubah (dua club menerima bersamaan: yang pertama menang, PRD 11.2).
    const r = tx
      .update(matches)
      .set({
        status: "terkonfirmasi",
        opponentClubId: m.opponentClubId ?? club.id,
        scheduledAt: p.startsAt,
        venueId: p.venueId,
        manualVenueName: p.manualVenueName,
        manualVenueAddress: p.manualVenueAddress,
        feeTotal: p.feeTotal ?? m.feeTotal,
        responseDeadline: null,
        updatedAt: now,
      })
      .where(and(eq(matches.id, matchId), eq(matches.status, m.status)))
      .run();
    if (r.changes !== 1) return false;
    tx.update(scheduleProposals).set({ status: "ditolak" }).where(and(eq(scheduleProposals.matchId, matchId), eq(scheduleProposals.status, "menunggu"))).run();
    tx.update(scheduleProposals).set({ status: "dipilih" }).where(eq(scheduleProposals.id, p.id)).run();
    for (const cid of [m.creatorClubId, m.opponentClubId ?? club.id]) {
      tx.insert(matchReadiness).values({ matchId, clubId: cid, updatedAt: now }).onConflictDoNothing().run();
    }
    if (terbuka) pesanSistem(tx, matchId, `${club.name} menerima match terbuka. Chat match dibuka.`, now);
    pesanSistem(tx, matchId, `Match terkonfirmasi: ${formatJadwal(p.startsAt)} WIB di ${namaLapangan({ venueId: p.venueId, manualName: p.manualVenueName })}.`, now);
    return true;
  });
  if (!berhasil) return { ok: false, error: "Match ini baru saja diterima club lain atau sudah berubah." };

  const lawanId = terbuka ? m.creatorClubId : lawanDari(m, club.id)!;
  await beritahu([idAdmin(lawanId)!], { trigger: "tantangan_diterima", title: `${club.name} menerima ajakan sparring`, body: `${formatJadwal(p.startsAt)} WIB`, url: `/club/match/${matchId}` });
  await beritahu(anggotaAktif([m.creatorClubId, m.opponentClubId ?? club.id]), { trigger: "match_baru", title: "Match baru terkonfirmasi. Ikut main?", body: `${formatJadwal(p.startsAt)} WIB`, url: `/pemain/match/${matchId}` });
  return { ok: true };
}

/** Tolak tantangan (penerima) atau akhiri negosiasi (salah satu peserta). */
export async function tolakAjakan(adminId: string, matchId: string, alasan: string | null, now = new Date()): Promise<Hasil> {
  const club = clubMilik(adminId);
  const m = ambil(db, matchId);
  if (!club || !m || !peserta(m, club.id)) return { ok: false, error: "Match tidak ditemukan." };
  const boleh = (m.status === "ditantang" && m.opponentClubId === club.id) || m.status === "dinegosiasi";
  if (!boleh) return { ok: false, error: "Ajakan ini tidak bisa ditolak." };
  db.transaction((tx) => {
    tx.update(matches).set({ status: "ditolak", responseDeadline: null, cancelNote: alasan, updatedAt: now }).where(eq(matches.id, matchId)).run();
    tx.update(scheduleProposals).set({ status: "ditolak" }).where(and(eq(scheduleProposals.matchId, matchId), eq(scheduleProposals.status, "menunggu"))).run();
    pesanSistem(tx, matchId, `${club.name} menolak ajakan${alasan ? `: ${alasan}` : "."}`, now);
  });
  await beritahu([idAdmin(lawanDari(m, club.id))!].filter(Boolean), { trigger: "tantangan_ditolak", title: `${club.name} menolak ajakan sparring`, body: alasan ?? undefined, url: `/club/match/${matchId}` });
  return { ok: true };
}

/** Tawar balik jadwal/lapangan (M-04): maksimal 3 putaran, tiap putaran 72 jam. */
export async function tawarBalik(adminId: string, matchId: string, u: InputUsulan, now = new Date()): Promise<Hasil> {
  const s = clubSiap(adminId);
  if (!s.ok) return s;
  const { club } = s;
  const m = ambil(db, matchId);
  if (!m) return { ok: false, error: "Match tidak ditemukan." };
  const eLap = cekLapangan(u.lapangan, m.format);
  if (eLap) return { ok: false, error: eLap };

  const terbuka = m.status === "terbuka" && m.type === "terbuka" && m.creatorClubId !== club.id;
  if (terbuka && salingBlokir(club.id, m.creatorClubId)) return { ok: false, error: "Match ini tidak tersedia." };
  if (!terbuka && pihakMenunggu(m, usulanTerbaru(db, matchId)) !== club.id) return { ok: false, error: "Bukan giliran club kamu untuk merespons." };
  const putaran = m.negotiationRound + 1;
  if (putaran > MAKS_PUTARAN) return { ok: false, error: `Sudah ${MAKS_PUTARAN} putaran tawar balik. Terima salah satu opsi atau tolak.` };

  const ok = db.transaction((tx) => {
    const r = tx
      .update(matches)
      .set({ status: "dinegosiasi", opponentClubId: m.opponentClubId ?? club.id, negotiationRound: putaran, responseDeadline: tenggatRespons(now, u.opsi), updatedAt: now })
      .where(and(eq(matches.id, matchId), eq(matches.status, m.status)))
      .run();
    if (r.changes !== 1) return false;
    tx.update(scheduleProposals).set({ status: "ditolak" }).where(and(eq(scheduleProposals.matchId, matchId), eq(scheduleProposals.status, "menunggu"))).run();
    sisipkanUsulan(tx, matchId, putaran, club.id, u, now);
    pesanSistem(tx, matchId, `${club.name} menawar balik (putaran ${putaran}/${MAKS_PUTARAN}): ${u.opsi.map(formatJadwal).join(" / ")} di ${namaLapangan(u.lapangan)}.${u.pesan ? ` "${u.pesan}"` : ""}`, now);
    return true;
  });
  if (!ok) return { ok: false, error: "Match ini baru saja berubah. Muat ulang halaman." };
  const lawanId = terbuka ? m.creatorClubId : lawanDari(m, club.id)!;
  await beritahu([idAdmin(lawanId)!], { trigger: "tawar_balik", title: `${club.name} menawar balik jadwal`, url: `/club/match/${matchId}` });
  return { ok: true };
}

/** Pembuat menarik ajakan sebelum ada kesepakatan (tanpa penalti). */
export async function tarikAjakan(adminId: string, matchId: string, now = new Date()): Promise<Hasil> {
  const club = clubMilik(adminId);
  const m = ambil(db, matchId);
  if (!club || !m || m.creatorClubId !== club.id || !["terbuka", "ditantang"].includes(m.status)) return { ok: false, error: "Ajakan tidak bisa ditarik." };
  db.transaction((tx) => {
    tx.update(matches).set({ status: "dibatalkan", cancelledByClubId: club.id, cancelReason: "lainnya", cancelNote: "Ditarik sebelum ada kesepakatan.", lateCancel: false, responseDeadline: null, updatedAt: now }).where(eq(matches.id, matchId)).run();
    tx.update(scheduleProposals).set({ status: "kedaluwarsa" }).where(and(eq(scheduleProposals.matchId, matchId), eq(scheduleProposals.status, "menunggu"))).run();
  });
  if (m.opponentClubId) await beritahu([idAdmin(m.opponentClubId)!], { trigger: "tantangan_ditarik", title: `${club.name} menarik tantangannya`, url: `/club/match/${matchId}` });
  return { ok: true };
}

// ── Setelah terkonfirmasi ───────────────────────────────────────────────────

/** Pembatalan wajib dengan alasan (S-05). < 24 jam sebelum kick-off menurunkan keandalan, kecuali cuaca dengan bukti (7.2). */
export async function batalkanMatch(adminId: string, matchId: string, input: { alasan: Match["cancelReason"]; catatan: string; bukti?: string | null }, now = new Date()): Promise<Hasil<{ mendadak: boolean }>> {
  const club = clubMilik(adminId);
  const m = ambil(db, matchId);
  if (!club || !m || !peserta(m, club.id) || !["terkonfirmasi", "ditunda"].includes(m.status)) return { ok: false, error: "Match ini tidak bisa dibatalkan." };
  if (!input.alasan || input.alasan === "tidak_hadir") return { ok: false, error: "Pilih alasan pembatalan." };
  const mepet = m.status === "terkonfirmasi" && !!m.scheduledAt && m.scheduledAt.getTime() - now.getTime() < BATAS_BATAL_MENDADAK_MS;
  const mendadak = mepet && !(input.alasan === "cuaca" && !!input.bukti);
  const catatan = [input.catatan, input.bukti ? `Bukti: ${input.bukti}` : ""].filter(Boolean).join("\n");
  db.transaction((tx) => {
    tx.update(matches).set({ status: "dibatalkan", cancelledByClubId: club.id, cancelReason: input.alasan, cancelNote: catatan, lateCancel: mendadak, updatedAt: now }).where(eq(matches.id, matchId)).run();
    tx.update(matchChangeRequests).set({ status: "ditolak", decidedAt: now }).where(and(eq(matchChangeRequests.matchId, matchId), eq(matchChangeRequests.status, "menunggu"))).run();
    pesanSistem(tx, matchId, `${club.name} membatalkan match. Alasan: ${LABEL_ALASAN_BATAL[input.alasan!]}${input.catatan ? ` — ${input.catatan}` : ""}.${mendadak ? " Kurang dari 24 jam sebelum kick-off: keandalan club pembatal turun." : ""}`, now);
  });
  await beritahu([idAdmin(lawanDari(m, club.id))!], { trigger: "match_dibatalkan", title: `${club.name} membatalkan match`, body: LABEL_ALASAN_BATAL[input.alasan], url: `/club/match/${matchId}` });
  await beritahu(anggotaAktif([m.creatorClubId, m.opponentClubId!]), { trigger: "match_dibatalkan", title: "Match dibatalkan", url: `/pemain/match/${matchId}` });
  return { ok: true, mendadak };
}

export type Perubahan =
  | { jenis: "jadwal"; startsAt: Date }
  | { jenis: "lapangan"; lapangan: Lapangan }
  | { jenis: "tunda"; alasan: string; bukti: string | null };

const nilaiLapangan = (l: { venueId: string | null; manualName: string | null; manualAddress: string | null }) =>
  l.venueId ? `venue:${l.venueId}` : l.manualName ? `manual:${l.manualName}\n${l.manualAddress ?? ""}` : "";

/** Ajukan perubahan jadwal/lapangan atau penundaan; sah hanya bila disetujui lawan (S-04, S-06). */
export async function ajukanPerubahan(adminId: string, matchId: string, p: Perubahan, now = new Date()): Promise<Hasil> {
  const club = clubMilik(adminId);
  const m = ambil(db, matchId);
  if (!club || !m || !peserta(m, club.id)) return { ok: false, error: "Match tidak ditemukan." };
  const bolehStatus = p.jenis === "tunda" ? m.status === "terkonfirmasi" : ["terkonfirmasi", "ditunda"].includes(m.status);
  if (!bolehStatus) return { ok: false, error: "Perubahan ini tidak bisa diajukan pada status sekarang." };
  if (db.select({ id: matchChangeRequests.id }).from(matchChangeRequests).where(and(eq(matchChangeRequests.matchId, matchId), eq(matchChangeRequests.status, "menunggu"))).get()) {
    return { ok: false, error: "Masih ada usulan perubahan yang menunggu jawaban lawan." };
  }
  let dari = "";
  let ke = "";
  let reason: string | null = null;
  if (p.jenis === "jadwal") {
    if (p.startsAt.getTime() < now.getTime() + 3 * JAM) return { ok: false, error: "Jadwal baru minimal 3 jam dari sekarang." };
    if (m.status === "ditunda" && m.rescheduleDeadline && p.startsAt > m.rescheduleDeadline) return { ok: false, error: "Jadwal baru harus dalam 14 hari sejak penundaan." };
    dari = m.scheduledAt?.toISOString() ?? "";
    ke = p.startsAt.toISOString();
  } else if (p.jenis === "lapangan") {
    const e = cekLapangan(p.lapangan, m.format);
    if (e) return { ok: false, error: e };
    dari = nilaiLapangan({ venueId: m.venueId, manualName: m.manualVenueName, manualAddress: m.manualVenueAddress });
    ke = nilaiLapangan(p.lapangan);
  } else {
    reason = [p.alasan, p.bukti ? `Bukti: ${p.bukti}` : ""].filter(Boolean).join("\n");
  }
  const label = { jadwal: "jadwal", lapangan: "lapangan", tunda: "penundaan" }[p.jenis];
  db.transaction((tx) => {
    tx.insert(matchChangeRequests).values({ matchId, kind: p.jenis, requestedByClubId: club.id, fromValue: dari || null, toValue: ke || null, reason, createdAt: now }).run();
    pesanSistem(
      tx,
      matchId,
      p.jenis === "jadwal"
        ? `${club.name} mengusulkan jadwal baru: ${formatJadwal(p.startsAt)} WIB. Menunggu persetujuan lawan.`
        : p.jenis === "lapangan"
          ? `${club.name} mengusulkan pindah ke ${namaLapangan(p.lapangan)}. Menunggu persetujuan lawan.`
          : `${club.name} mengusulkan penundaan: ${p.alasan}. Menunggu persetujuan lawan.`,
      now,
    );
  });
  await beritahu([idAdmin(lawanDari(m, club.id))!], { trigger: "usulan_perubahan", title: `${club.name} mengusulkan perubahan ${label}`, url: `/club/match/${matchId}` });
  return { ok: true };
}

export async function putuskanPerubahan(adminId: string, requestId: string, setuju: boolean, now = new Date()): Promise<Hasil> {
  const club = clubMilik(adminId);
  const req = db.select().from(matchChangeRequests).where(eq(matchChangeRequests.id, requestId)).get();
  const m = req && ambil(db, req.matchId);
  if (!club || !req || !m || req.status !== "menunggu" || !peserta(m, club.id)) return { ok: false, error: "Usulan tidak ditemukan." };
  if (req.requestedByClubId === club.id) return { ok: false, error: "Usulan harus disetujui club lawan." };
  if (setuju && req.kind !== "tunda" && !["terkonfirmasi", "ditunda"].includes(m.status)) return { ok: false, error: "Match sudah berubah status." };
  if (setuju && req.kind === "tunda" && m.status !== "terkonfirmasi") return { ok: false, error: "Match sudah berubah status." };

  db.transaction((tx) => {
    tx.update(matchChangeRequests).set({ status: setuju ? "disetujui" : "ditolak", decidedBy: adminId, decidedAt: now }).where(eq(matchChangeRequests.id, requestId)).run();
    if (!setuju) {
      pesanSistem(tx, m.id, `${club.name} menolak usulan perubahan.`, now);
      return;
    }
    if (req.kind === "jadwal") {
      const baru = new Date(req.toValue!);
      tx.update(matches).set({ scheduledAt: baru, status: "terkonfirmasi", postponedAt: null, rescheduleDeadline: null, updatedAt: now }).where(eq(matches.id, m.id)).run();
      pesanSistem(tx, m.id, `Jadwal disepakati: ${formatJadwal(baru)} WIB.`, now);
    } else if (req.kind === "lapangan") {
      const [jenis, ...isi] = req.toValue!.split(":");
      const [nama, alamat] = isi.join(":").split("\n");
      const l = jenis === "venue" ? { venueId: isi.join(":"), manualVenueName: null, manualVenueAddress: null } : { venueId: null, manualVenueName: nama, manualVenueAddress: alamat ?? null };
      tx.update(matches).set({ ...l, updatedAt: now }).where(eq(matches.id, m.id)).run();
      pesanSistem(tx, m.id, `Lapangan disepakati: ${namaLapangan({ venueId: l.venueId, manualName: l.manualVenueName })}.`, now);
    } else {
      tx.update(matches).set({ status: "ditunda", postponedAt: now, rescheduleDeadline: new Date(now.getTime() + MASA_TUNDA_MS), updatedAt: now }).where(eq(matches.id, m.id)).run();
      pesanSistem(tx, m.id, "Penundaan disepakati tanpa penalti. Pilih jadwal baru dalam 14 hari, atau match dibatalkan tanpa penalti.", now);
    }
  });
  await beritahu([idAdmin(req.requestedByClubId)!], { trigger: "keputusan_perubahan", title: `${club.name} ${setuju ? "menyetujui" : "menolak"} usulan perubahan`, url: `/club/match/${m.id}` });
  if (setuju) await beritahu(anggotaAktif([m.creatorClubId, m.opponentClubId!]), { trigger: "perubahan_match", title: req.kind === "tunda" ? "Match ditunda" : "Jadwal/lapangan match berubah", url: `/pemain/match/${m.id}` });
  return { ok: true };
}

