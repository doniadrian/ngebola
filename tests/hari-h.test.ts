import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, clubRatings, clubs, disputes, matches, moderationFlags, ratingHistory, resultConfirmations, scoreEntries, venues } from "@/db/schema";
import { createUser } from "@/server/auth/service";
import { beriPenilaian, checkIn, konfirmasiHasil, mulaiMatch, penilaianMatch, prosesTenggatHariH, putuskanSengketa, sinkronSkor, tambahBukti, type EntriKlien } from "@/server/hari-h";
import { buatMatch, terimaUsulan, usulanTerbaru } from "@/server/match";
import { HARI, JAM, MENIT } from "@/lib/waktu";
import { cookieJar } from "./helpers";

const KICKOFF = new Date("2026-11-07T12:00:00Z"); // Sab 19.00 WIB
const pada = (menit: number) => new Date(KICKOFF.getTime() + menit * MENIT);
let venue = "";
let n = 0;

async function clubBaru() {
  const r = await createUser({ email: `h${++n}-${Date.now()}@contoh.id`, password: "rahasia-kuat-123", name: "Admin", role: "club_admin" });
  if (!r.ok) throw new Error();
  const id = crypto.randomUUID();
  db.insert(clubs).values({ id, adminUserId: r.userId, slug: `club-h${n}`, name: `Club H${n}`, nameKey: `clubh${n}`, area: "Sail", level: "menengah", initials: "CH", squadCode: `H${String(n).padStart(5, "0")}`, registrationStatus: "disetujui" }).run();
  return { id, adminId: r.userId };
}

async function terkonfirmasi(a?: Awaited<ReturnType<typeof clubBaru>>, b?: Awaited<ReturnType<typeof clubBaru>>, kickoff = KICKOFF) {
  a ??= await clubBaru();
  b ??= await clubBaru();
  const sebelum = new Date(kickoff.getTime() - 3 * HARI);
  const r = await buatMatch(a.adminId, { jenis: "tantangan", lawanClubId: b.id, format: "mini", usulan: { opsi: [kickoff], lapangan: { venueId: venue, manualName: null, manualAddress: null }, feeTotal: null, pesan: null } }, sebelum);
  if (!r.ok) throw new Error(r.error);
  const t = await terimaUsulan(b.adminId, r.matchId, usulanTerbaru(db, r.matchId)[0].id, sebelum);
  if (!t.ok) throw new Error(t.error);
  return { a, b, id: r.matchId };
}

const entri = (menit: number, half: number, x: number, y: number, event: EntriKlien["event"]): EntriKlien => ({ clientEntryId: crypto.randomUUID(), half, creatorScore: x, opponentScore: y, event, recordedAt: pada(menit).toISOString() });

async function dimainkan(skor: [number, number] = [2, 1]) {
  const x = await terkonfirmasi();
  await checkIn(x.a.adminId, x.id, null, pada(-30));
  await checkIn(x.b.adminId, x.id, null, pada(-20));
  expect(mulaiMatch(x.a.adminId, x.id, pada(0)).ok).toBe(true);
  const r = await sinkronSkor(x.a.adminId, x.id, [entri(10, 1, 1, 0, "skor"), entri(35, 1, 1, 0, "akhir_babak"), entri(45, 2, 1, 0, "mulai"), entri(80, 2, skor[0], skor[1], "selesai")], pada(81));
  expect(r).toMatchObject({ ok: true, diterima: 4, konflik: 0 });
  return x;
}

const m = (id: string) => db.select().from(matches).where(eq(matches.id, id)).get()!;

beforeEach(() => {
  cookieJar.clear();
  if (!venue) {
    venue = crypto.randomUUID();
    db.insert(venues).values({ id: venue, name: "Lap H", address: "Jl. H", area: "Sail", surface: "sintetis", forMini: true, forFootball: true }).run();
  }
});

describe("check-in & mulai", () => {
  it("check-in dibuka 60 menit sebelum kick-off, sekali per club, hanya peserta", async () => {
    const x = await terkonfirmasi();
    const c = await clubBaru();
    expect((await checkIn(x.a.adminId, x.id, null, pada(-61))).ok).toBe(false);
    expect((await checkIn(c.adminId, x.id, null, pada(-30))).ok).toBe(false);
    expect((await checkIn(x.a.adminId, x.id, { lat: 0.5, lng: 101.4 }, pada(-30))).ok).toBe(true);
    expect((await checkIn(x.a.adminId, x.id, null, pada(-25))).ok).toBe(false);
  });

  it("mulai butuh kedua club check-in; yang pertama menjadi satu-satunya pencatat", async () => {
    const x = await terkonfirmasi();
    await checkIn(x.a.adminId, x.id, null, pada(-30));
    expect(mulaiMatch(x.a.adminId, x.id, pada(-5)).ok).toBe(false);
    await checkIn(x.b.adminId, x.id, null, pada(-10));
    expect(mulaiMatch(x.b.adminId, x.id, pada(0)).ok).toBe(true);
    expect(mulaiMatch(x.a.adminId, x.id, pada(0)).ok).toBe(false);
    expect(m(x.id)).toMatchObject({ status: "berlangsung", scorerClubId: x.b.id });
    expect((await sinkronSkor(x.a.adminId, x.id, [entri(5, 1, 1, 0, "skor")], pada(5))).ok).toBe(false);
  });
});

describe("pencatatan skor & konfirmasi hasil", () => {
  it("sinkron idempoten; peluit akhir → Menunggu konfirmasi dengan pengusul = pencatat", async () => {
    const x = await dimainkan([2, 1]);
    expect(m(x.id)).toMatchObject({ status: "menunggu_hasil" });
    const rc = db.select().from(resultConfirmations).where(eq(resultConfirmations.matchId, x.id)).get()!;
    expect(rc).toMatchObject({ proposerClubId: x.a.id, creatorScore: 2, opponentScore: 1 });
    expect(rc.deadline.getTime() - pada(81).getTime()).toBe(48 * JAM);
    // Kirim ulang catatan yang sama tidak menggandakan.
    const semua = db.select().from(scoreEntries).where(eq(scoreEntries.matchId, x.id)).all();
    const ulang = semua.map((s) => ({ clientEntryId: s.clientEntryId, half: s.half, creatorScore: s.creatorScore, opponentScore: s.opponentScore, event: s.event, recordedAt: s.recordedAt.toISOString() }));
    expect(await sinkronSkor(x.a.adminId, x.id, ulang, pada(90))).toMatchObject({ ok: true, diterima: 0 });
    // Catatan offline yang terlambat setelah selesai ditandai konflik.
    expect(await sinkronSkor(x.a.adminId, x.id, [entri(60, 2, 5, 5, "skor")], pada(95))).toMatchObject({ ok: true, konflik: 1 });
  });

  it("pengusul tidak bisa mengonfirmasi; lawan setuju → Selesai, skor resmi, rating berubah", async () => {
    const x = await dimainkan([2, 1]);
    expect((await konfirmasiHasil(x.a.adminId, x.id, { setuju: true }, pada(100))).ok).toBe(false);
    expect((await konfirmasiHasil(x.b.adminId, x.id, { setuju: true }, pada(100))).ok).toBe(true);
    expect(m(x.id)).toMatchObject({ status: "selesai", finalCreatorScore: 2, finalOpponentScore: 1 });
    const r = db.select().from(clubRatings).where(eq(clubRatings.clubId, x.a.id)).get()!;
    expect(r).toMatchObject({ format: "mini", rating: 1220, confirmedMatches: 1 });
    expect(db.select().from(ratingHistory).where(eq(ratingHistory.matchId, x.id)).all()).toHaveLength(2);
  });

  it("tanpa respons 48 jam → skor pengusul sah", async () => {
    const x = await dimainkan([3, 0]);
    await prosesTenggatHariH(pada(81 + 47 * 60));
    expect(m(x.id).status).toBe("menunggu_hasil");
    await prosesTenggatHariH(pada(81 + 49 * 60));
    expect(m(x.id)).toMatchObject({ status: "selesai", finalCreatorScore: 3, finalOpponentScore: 0 });
  });
});

describe("sengketa", () => {
  it("sanggah → Sengketa; bukti tautan + catatan; Admin platform mengoreksi skor (audit + rating)", async () => {
    const x = await dimainkan([2, 1]);
    expect((await konfirmasiHasil(x.b.adminId, x.id, { setuju: false, skorPembuat: 2, skorLawan: 1 }, pada(100))).ok).toBe(false); // sama dengan usulan
    expect((await konfirmasiHasil(x.b.adminId, x.id, { setuju: false, skorPembuat: 1, skorLawan: 1 }, pada(100))).ok).toBe(true);
    expect(m(x.id).status).toBe("sengketa");
    expect(tambahBukti(x.b.adminId, x.id, { catatan: "Gol kedua offside", url: "ftp://x" }, pada(110)).ok).toBe(false);
    expect(tambahBukti(x.b.adminId, x.id, { catatan: "Gol kedua offside", url: "https://contoh.id/video" }, pada(110)).ok).toBe(true);
    const platform = await createUser({ email: `pf${Date.now()}@contoh.id`, password: "rahasia-kuat-123", name: "PF", role: "platform_admin" });
    if (!platform.ok) throw new Error();
    expect((await putuskanSengketa(platform.userId, x.id, { keputusan: "koreksi", skor: [2, 2], alasan: "x" }, pada(200))).ok).toBe(false);
    expect((await putuskanSengketa(platform.userId, x.id, { keputusan: "koreksi", skor: [2, 2], alasan: "Video menunjukkan gol kedua sah, gol ketiga offside." }, pada(200))).ok).toBe(true);
    expect(m(x.id)).toMatchObject({ status: "selesai", finalCreatorScore: 2, finalOpponentScore: 2 });
    expect(db.select().from(auditLogs).where(and(eq(auditLogs.targetId, x.id), eq(auditLogs.action, "putus_sengketa_koreksi"))).get()).toBeDefined();
    expect(db.select().from(ratingHistory).where(eq(ratingHistory.matchId, x.id)).all()).toHaveLength(2);
  });

  it("penyanggah tanpa bukti 48 jam → skor pengusul disahkan; keputusan batal tidak mengubah rating", async () => {
    const x = await dimainkan([1, 0]);
    await konfirmasiHasil(x.b.adminId, x.id, { setuju: false, skorPembuat: 0, skorLawan: 0 }, pada(100));
    await prosesTenggatHariH(pada(100 + 49 * 60));
    expect(m(x.id)).toMatchObject({ status: "selesai", finalCreatorScore: 1, finalOpponentScore: 0 });
    expect(db.select().from(disputes).where(eq(disputes.matchId, x.id)).get()?.decision).toBe("pengusul");

    const y = await dimainkan([1, 0]);
    await konfirmasiHasil(y.b.adminId, y.id, { setuju: false, skorPembuat: 0, skorLawan: 3 }, pada(100));
    await putuskanSengketa(null, y.id, { keputusan: "batal", alasan: "Bukti kedua pihak tidak bisa diverifikasi." }, pada(150));
    expect(m(y.id)).toMatchObject({ status: "selesai", excludedFromRating: true, finalCreatorScore: null });
    expect(db.select().from(ratingHistory).where(eq(ratingHistory.matchId, y.id)).all()).toHaveLength(0);
  });
});

describe("WO & tidak hadir (D-06, 10.1)", () => {
  it("hanya satu club check-in setelah 20 menit → WO 3-0 tanpa Elo; tidak ada yang check-in → dibatalkan, keduanya penalti", async () => {
    const x = await terkonfirmasi();
    await checkIn(x.b.adminId, x.id, null, pada(-10));
    const y = await terkonfirmasi();
    await prosesTenggatHariH(pada(19));
    expect(m(x.id).status).toBe("terkonfirmasi");
    await prosesTenggatHariH(pada(21));
    expect(m(x.id)).toMatchObject({ status: "wo", woWinnerClubId: x.b.id, finalCreatorScore: 0, finalOpponentScore: 3, excludedFromRating: true });
    expect(m(y.id)).toMatchObject({ status: "dibatalkan", cancelReason: "tidak_hadir", lateCancel: true });
    expect(db.select().from(ratingHistory).where(eq(ratingHistory.matchId, x.id)).all()).toHaveLength(0);
  });
});

describe("penilaian (H-06)", () => {
  it("tersembunyi sampai keduanya mengisi atau 7 hari; sekali per club", async () => {
    const x = await dimainkan();
    await konfirmasiHasil(x.b.adminId, x.id, { setuju: true }, pada(100));
    expect(beriPenilaian(x.a.adminId, x.id, { sportivitas: 6, kerapian: 3, komentar: null }, pada(120)).ok).toBe(false);
    expect(beriPenilaian(x.a.adminId, x.id, { sportivitas: 5, kerapian: 4, komentar: "Main sportif" }, pada(120)).ok).toBe(true);
    expect(beriPenilaian(x.a.adminId, x.id, { sportivitas: 5, kerapian: 4, komentar: null }, pada(121)).ok).toBe(false);
    expect(penilaianMatch(x.id, x.b.id, pada(130))).toMatchObject({ terbuka: false, daftar: [] });
    expect(penilaianMatch(x.id, x.a.id, pada(130)).daftar).toHaveLength(1);
    expect(penilaianMatch(x.id, x.b.id, new Date(pada(81).getTime() + 8 * HARI)).terbuka).toBe(true);
    expect(beriPenilaian(x.b.adminId, x.id, { sportivitas: 4, kerapian: 4, komentar: null }, pada(140)).ok).toBe(true);
    expect(penilaianMatch(x.id, x.b.id, pada(141))).toMatchObject({ terbuka: true });
  });
});

describe("anti-manipulasi (7.4)", () => {
  it("match ke-4 antar pasangan yang sama dalam 30 hari diabaikan dari rating dan ditandai", async () => {
    const a = await clubBaru();
    const b = await clubBaru();
    const ids: string[] = [];
    for (let i = 0; i < 4; i++) {
      const k = new Date(KICKOFF.getTime() + i * 5 * HARI);
      const x = await terkonfirmasi(a, b, k);
      const t = (menit: number) => new Date(k.getTime() + menit * MENIT);
      await checkIn(a.adminId, x.id, null, t(-30));
      await checkIn(b.adminId, x.id, null, t(-20));
      mulaiMatch(a.adminId, x.id, t(0));
      const e = (menit: number, half: number, s: [number, number], ev: EntriKlien["event"]): EntriKlien => ({ clientEntryId: crypto.randomUUID(), half, creatorScore: s[0], opponentScore: s[1], event: ev, recordedAt: t(menit).toISOString() });
      await sinkronSkor(a.adminId, x.id, [e(35, 1, [0, 0], "akhir_babak"), e(45, 2, [0, 0], "mulai"), e(80, 2, [1, 0], "selesai")], t(81));
      await konfirmasiHasil(b.adminId, x.id, { setuju: true }, t(100));
      ids.push(x.id);
    }
    expect(ids.map((id) => m(id).excludedFromRating)).toEqual([false, false, false, true]);
    expect(db.select().from(moderationFlags).where(and(eq(moderationFlags.kind, "pasangan_sering"), eq(moderationFlags.matchId, ids[3]))).get()).toBeDefined();
  });
});

describe("leaderboard: main, menang, seri, kalah", () => {
  it("dihitung dari hasil yang dirating; WO tidak ikut; jumlahnya sama dengan main", async () => {
    const { leaderboard } = await import("@/server/queries/publik");
    const a = await clubBaru();
    const b = await clubBaru();
    const skor: [number, number][] = [[2, 0], [1, 1], [0, 3], [2, 1], [1, 0]]; // a: M S K M M
    for (let i = 0; i < skor.length; i++) {
      const k = new Date(KICKOFF.getTime() + (i + 1) * 40 * HARI); // jauh antar match: tidak memicu anti-manipulasi
      const x = await terkonfirmasi(a, b, k);
      const t = (menit: number) => new Date(k.getTime() + menit * MENIT);
      await checkIn(a.adminId, x.id, null, t(-30));
      await checkIn(b.adminId, x.id, null, t(-20));
      mulaiMatch(a.adminId, x.id, t(0));
      const e = (menit: number, half: number, s: [number, number], ev: EntriKlien["event"]): EntriKlien => ({ clientEntryId: crypto.randomUUID(), half, creatorScore: s[0], opponentScore: s[1], event: ev, recordedAt: t(menit).toISOString() });
      await sinkronSkor(a.adminId, x.id, [e(35, 1, [0, 0], "akhir_babak"), e(45, 2, [0, 0], "mulai"), e(80, 2, skor[i], "selesai")], t(81));
      await konfirmasiHasil(b.adminId, x.id, { setuju: true }, t(100));
    }
    const papan = leaderboard("mini");
    const semua = [...papan.resmi, ...papan.sementara];
    const ra = semua.find((r) => r.clubId === a.id)!;
    const rb = semua.find((r) => r.clubId === b.id)!;
    expect([ra.main, ra.menang, ra.seri, ra.kalah]).toEqual([5, 3, 1, 1]);
    expect([rb.main, rb.menang, rb.seri, rb.kalah]).toEqual([5, 1, 1, 3]);
    expect(ra.menang + ra.seri + ra.kalah).toBe(ra.main);
  });
});
