import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, clubs, matches, matchReadiness, rsvps, scheduleProposals, squadMemberships, venues } from "@/db/schema";
import type { InputUsulan } from "@/lib/form-match";
import { HARI, JAM } from "@/lib/waktu";
import { buatMatchAction, kirimPesanAction, rsvpAction } from "@/server/actions/match";
import { aturBlokir, kirimPesan } from "@/server/chat";
import { aturKesiapan, simpanRsvp } from "@/server/kesiapan";
import {
  ajukanPerubahan,
  batalkanMatch,
  buatMatch,
  putuskanPerubahan,
  tawarBalik,
  terimaUsulan,
  tolakAjakan,
  usulanTerbaru,
} from "@/server/match";
import { prosesTenggatMatch } from "@/server/tenggat";
import { createUser } from "@/server/auth/service";
import { masukSebagai } from "./akun";
import { cookieJar, formData, tangkapRedirect } from "./helpers";

const NOW = new Date("2026-11-02T03:00:00Z"); // Senin 10.00 WIB
const nanti = (jam: number) => new Date(NOW.getTime() + jam * JAM);
let venueMini = "";

let n = 0;
async function clubBaru(nama = `Club M${++n}`) {
  const r = await createUser({ email: `m${n}-${Date.now()}@contoh.id`, password: "rahasia-kuat-123", name: "Admin", role: "club_admin" });
  if (!r.ok) throw new Error();
  const id = crypto.randomUUID();
  db.insert(clubs).values({ id, adminUserId: r.userId, slug: `club-m${n}`, name: nama, nameKey: `clubm${n}`, area: "Sail", level: "menengah", initials: "CM", squadCode: `M${String(n).padStart(5, "0")}`, registrationStatus: "disetujui" }).run();
  return { id, adminId: r.userId };
}

async function pemainDi(clubId: string) {
  const r = await createUser({ email: `p${++n}-${Date.now()}@contoh.id`, password: "rahasia-kuat-123", name: `Pemain ${n}`, role: "player" });
  if (!r.ok) throw new Error();
  db.insert(squadMemberships).values({ playerUserId: r.userId, clubId, status: "aktif", via: "kode" }).run();
  return r.userId;
}

const usulan = (jam: number[], venueId: string | null = venueMini): InputUsulan => ({
  opsi: jam.map(nanti),
  lapangan: { venueId, manualName: null, manualAddress: null },
  feeTotal: 450000,
  pesan: null,
});

const status = (id: string) => db.select().from(matches).where(eq(matches.id, id)).get()!;

async function matchTerkonfirmasi(jamKickoff = 72) {
  const a = await clubBaru();
  const b = await clubBaru();
  const r = await buatMatch(a.adminId, { jenis: "tantangan", lawanClubId: b.id, format: "mini", usulan: usulan([jamKickoff]) }, NOW);
  if (!r.ok) throw new Error(r.error);
  const p = usulanTerbaru(db, r.matchId)[0];
  const t = await terimaUsulan(b.adminId, r.matchId, p.id, NOW);
  if (!t.ok) throw new Error(t.error);
  return { a, b, matchId: r.matchId };
}

beforeEach(() => {
  cookieJar.clear();
  if (!venueMini) {
    venueMini = crypto.randomUUID();
    db.insert(venues).values({ id: venueMini, name: "Lapangan Uji", address: "Jl. Uji", area: "Sail", surface: "sintetis", forMini: true, forFootball: false }).run();
  }
});

describe("match terbuka & tantangan", () => {
  it("maksimal 3 match terbuka aktif per club", async () => {
    const a = await clubBaru();
    for (let i = 0; i < 3; i++) expect((await buatMatch(a.adminId, { jenis: "terbuka", format: "mini", usulan: usulan([48 + i]) }, NOW)).ok).toBe(true);
    const r = await buatMatch(a.adminId, { jenis: "terbuka", format: "mini", usulan: usulan([60]) }, NOW);
    expect(r.ok).toBe(false);
  });

  it("lapangan direktori harus sesuai format", async () => {
    const a = await clubBaru();
    const r = await buatMatch(a.adminId, { jenis: "terbuka", format: "football", usulan: usulan([48]) }, NOW);
    expect(r).toMatchObject({ ok: false, error: expect.stringMatching(/tidak untuk Football/) });
  });

  it("club belum disetujui tidak bisa membuat match; Pemain diarahkan keluar", async () => {
    const a = await clubBaru();
    db.update(clubs).set({ registrationStatus: "diajukan" }).where(eq(clubs.id, a.id)).run();
    expect((await buatMatch(a.adminId, { jenis: "terbuka", format: "mini", usulan: usulan([48]) }, NOW)).ok).toBe(false);
    await masukSebagai("player");
    expect(await tangkapRedirect(() => buatMatchAction("terbuka", null, {}, formData({ format: "mini" })))).toBe("/pemain");
  });

  it("opsi jadwal kurang dari 25 jam ditolak oleh form", async () => {
    await masukSebagai("club_admin");
    const besok = new Date(Date.now() + 5 * JAM);
    const tgl = besok.toISOString().slice(0, 10);
    const r = await buatMatchAction("terbuka", null, {}, formData({ format: "mini", tanggal_0: tgl, jam_0: "06:00", venueId: venueMini }));
    expect(r.fieldErrors?.opsi).toBeDefined();
  });

  it("dua club menerima match terbuka yang sama: yang pertama menang", async () => {
    const a = await clubBaru();
    const b = await clubBaru();
    const c = await clubBaru();
    const r = await buatMatch(a.adminId, { jenis: "terbuka", format: "mini", usulan: usulan([48, 72]) }, NOW);
    if (!r.ok) throw new Error();
    const [p1, p2] = usulanTerbaru(db, r.matchId);
    expect((await terimaUsulan(b.adminId, r.matchId, p1.id, NOW)).ok).toBe(true);
    expect((await terimaUsulan(c.adminId, r.matchId, p2.id, NOW)).ok).toBe(false);
    expect(status(r.matchId)).toMatchObject({ status: "terkonfirmasi", opponentClubId: b.id, scheduledAt: p1.startsAt });
    expect(db.select().from(matchReadiness).where(eq(matchReadiness.matchId, r.matchId)).all()).toHaveLength(2);
  });

  it("pembuat tidak bisa menerima match terbukanya sendiri", async () => {
    const a = await clubBaru();
    const r = await buatMatch(a.adminId, { jenis: "terbuka", format: "mini", usulan: usulan([48]) }, NOW);
    if (!r.ok) throw new Error();
    expect((await terimaUsulan(a.adminId, r.matchId, usulanTerbaru(db, r.matchId)[0].id, NOW)).ok).toBe(false);
  });

  it("satu tantangan aktif per pasangan (dua arah); club yang diblokir tidak bisa menantang", async () => {
    const a = await clubBaru();
    const b = await clubBaru();
    expect((await buatMatch(a.adminId, { jenis: "tantangan", lawanClubId: b.id, format: "mini", usulan: usulan([48]) }, NOW)).ok).toBe(true);
    expect((await buatMatch(b.adminId, { jenis: "tantangan", lawanClubId: a.id, format: "mini", usulan: usulan([50]) }, NOW)).ok).toBe(false);
    const c = await clubBaru();
    aturBlokir(c.adminId, a.id, true);
    expect((await buatMatch(a.adminId, { jenis: "tantangan", lawanClubId: c.id, format: "mini", usulan: usulan([48]) }, NOW)).ok).toBe(false);
  });

  it("tawar balik bergantian maksimal 3 putaran; yang bukan gilirannya ditolak", async () => {
    const a = await clubBaru();
    const b = await clubBaru();
    const r = await buatMatch(a.adminId, { jenis: "tantangan", lawanClubId: b.id, format: "mini", usulan: usulan([48]) }, NOW);
    if (!r.ok) throw new Error();
    expect((await tawarBalik(a.adminId, r.matchId, usulan([50]), NOW)).ok).toBe(false); // bukan giliran A
    expect((await tawarBalik(b.adminId, r.matchId, usulan([52]), NOW)).ok).toBe(true); // putaran 1
    expect(status(r.matchId).status).toBe("dinegosiasi");
    expect((await tawarBalik(a.adminId, r.matchId, usulan([54]), NOW)).ok).toBe(true); // putaran 2
    expect((await tawarBalik(b.adminId, r.matchId, usulan([56]), NOW)).ok).toBe(true); // putaran 3
    expect((await tawarBalik(a.adminId, r.matchId, usulan([58]), NOW))).toMatchObject({ ok: false, error: expect.stringMatching(/3 putaran/) });
    const terbaru = usulanTerbaru(db, r.matchId);
    expect(terbaru[0].round).toBe(3);
    // B tidak bisa menerima tawarannya sendiri; A bisa.
    expect((await terimaUsulan(b.adminId, r.matchId, terbaru[0].id, NOW)).ok).toBe(false);
    expect((await terimaUsulan(a.adminId, r.matchId, terbaru[0].id, NOW)).ok).toBe(true);
    expect(status(r.matchId).scheduledAt).toEqual(nanti(56));
    expect(db.select().from(chatMessages).where(eq(chatMessages.matchId, r.matchId)).all().length).toBeGreaterThan(3);
  });

  it("lapangan manual tersimpan di usulan dan terbawa ke match saat diterima", async () => {
    const a = await clubBaru();
    const b = await clubBaru();
    const u: InputUsulan = { opsi: [nanti(48)], lapangan: { venueId: null, manualName: "Lapangan Pak RT", manualAddress: "Jl. Kenanga 5" }, feeTotal: null, pesan: null };
    const r = await buatMatch(a.adminId, { jenis: "terbuka", format: "mini", usulan: u }, NOW);
    if (!r.ok) throw new Error();
    const p = usulanTerbaru(db, r.matchId)[0];
    expect(p).toMatchObject({ manualVenueName: "Lapangan Pak RT", manualVenueAddress: "Jl. Kenanga 5" });
    expect((await terimaUsulan(b.adminId, r.matchId, p.id, NOW)).ok).toBe(true);
    expect(status(r.matchId)).toMatchObject({ manualVenueName: "Lapangan Pak RT", manualVenueAddress: "Jl. Kenanga 5", venueId: null });
  });

  it("opsi tanpa lapangan tidak bisa langsung diterima", async () => {
    const a = await clubBaru();
    const b = await clubBaru();
    const r = await buatMatch(a.adminId, { jenis: "tantangan", lawanClubId: b.id, format: "mini", usulan: usulan([48], null) }, NOW);
    if (!r.ok) throw new Error();
    expect(await terimaUsulan(b.adminId, r.matchId, usulanTerbaru(db, r.matchId)[0].id, NOW)).toMatchObject({ ok: false, error: expect.stringMatching(/lapangan/) });
  });

  it("penerima menolak → Ditolak", async () => {
    const a = await clubBaru();
    const b = await clubBaru();
    const r = await buatMatch(a.adminId, { jenis: "tantangan", lawanClubId: b.id, format: "mini", usulan: usulan([48]) }, NOW);
    if (!r.ok) throw new Error();
    expect((await tolakAjakan(a.adminId, r.matchId, null, NOW)).ok).toBe(false);
    expect((await tolakAjakan(b.adminId, r.matchId, "Bentrok jadwal", NOW)).ok).toBe(true);
    expect(status(r.matchId).status).toBe("ditolak");
  });
});

describe("tenggat otomatis", () => {
  it("tantangan tanpa respons 72 jam (atau 24 jam sebelum jadwal) → Kedaluwarsa", async () => {
    const a = await clubBaru();
    const b = await clubBaru();
    const r = await buatMatch(a.adminId, { jenis: "tantangan", lawanClubId: b.id, format: "mini", usulan: usulan([40]) }, NOW);
    if (!r.ok) throw new Error();
    expect(status(r.matchId).responseDeadline).toEqual(nanti(16)); // 24 jam sebelum jadwal, lebih dekat dari 72 jam
    await prosesTenggatMatch(nanti(15));
    expect(status(r.matchId).status).toBe("ditantang");
    await prosesTenggatMatch(nanti(17));
    expect(status(r.matchId).status).toBe("kedaluwarsa");
  });

  it("match terbuka kedaluwarsa bila tak ada opsi > 24 jam lagi", async () => {
    const a = await clubBaru();
    const r = await buatMatch(a.adminId, { jenis: "terbuka", format: "mini", usulan: usulan([30]) }, NOW);
    if (!r.ok) throw new Error();
    await prosesTenggatMatch(nanti(5));
    expect(status(r.matchId).status).toBe("terbuka");
    await prosesTenggatMatch(nanti(7));
    expect(status(r.matchId).status).toBe("kedaluwarsa");
  });

  it("ditunda tanpa jadwal baru 14 hari → Dibatalkan tanpa penalti", async () => {
    const { a, b, matchId } = await matchTerkonfirmasi();
    expect((await ajukanPerubahan(a.adminId, matchId, { jenis: "tunda", alasan: "Hujan deras", bukti: null }, NOW)).ok).toBe(true);
    const req = (await import("@/db/schema")).matchChangeRequests;
    const id = db.select().from(req).where(eq(req.matchId, matchId)).get()!.id;
    expect((await putuskanPerubahan(a.adminId, id, true, NOW)).ok).toBe(false); // pengusul tidak bisa menyetujui sendiri
    expect((await putuskanPerubahan(b.adminId, id, true, NOW)).ok).toBe(true);
    expect(status(matchId).status).toBe("ditunda");
    await prosesTenggatMatch(new Date(NOW.getTime() + 15 * HARI));
    expect(status(matchId)).toMatchObject({ status: "dibatalkan", lateCancel: false });
  });
});

describe("setelah terkonfirmasi", () => {
  it("batal < 24 jam menurunkan keandalan; cuaca dengan bukti tidak", async () => {
    const x = await matchTerkonfirmasi(30);
    const r1 = await batalkanMatch(x.a.adminId, x.matchId, { alasan: "bentrok_jadwal", catatan: "Maaf" }, nanti(10));
    expect(r1).toMatchObject({ ok: true, mendadak: true });
    expect(status(x.matchId)).toMatchObject({ status: "dibatalkan", lateCancel: true, cancelledByClubId: x.a.id });

    const y = await matchTerkonfirmasi(30);
    expect(await batalkanMatch(y.b.adminId, y.matchId, { alasan: "cuaca", catatan: "Banjir", bukti: "https://contoh.id/foto" }, nanti(10))).toMatchObject({ ok: true, mendadak: false });
  });

  it("perubahan jadwal sah hanya setelah disetujui lawan; ditunda → jadwal baru → Terkonfirmasi", async () => {
    const { a, b, matchId } = await matchTerkonfirmasi();
    const { matchChangeRequests } = await import("@/db/schema");
    await ajukanPerubahan(a.adminId, matchId, { jenis: "jadwal", startsAt: nanti(96) }, NOW);
    expect(status(matchId).scheduledAt).toEqual(nanti(72));
    expect((await ajukanPerubahan(b.adminId, matchId, { jenis: "jadwal", startsAt: nanti(100) }, NOW)).ok).toBe(false); // satu usulan menunggu
    const req = db.select().from(matchChangeRequests).where(and(eq(matchChangeRequests.matchId, matchId), eq(matchChangeRequests.status, "menunggu"))).get()!;
    expect((await putuskanPerubahan(b.adminId, req.id, true, NOW)).ok).toBe(true);
    expect(status(matchId).scheduledAt).toEqual(nanti(96));
  });

  it("RSVP: hanya pemain club peserta, terkunci 2 jam sebelum kick-off, menghitung kesiapan", async () => {
    const { a, matchId } = await matchTerkonfirmasi(72);
    const pemain = await Promise.all(Array.from({ length: 6 }, () => pemainDi(a.id)));
    const luar = await pemainDi((await clubBaru()).id);
    expect((await simpanRsvp(luar, matchId, "ikut", NOW)).ok).toBe(false);
    for (const p of pemain.slice(0, 5)) expect((await simpanRsvp(p, matchId, "ikut", NOW)).ok).toBe(true);
    const siap = () => db.select().from(matchReadiness).where(and(eq(matchReadiness.matchId, matchId), eq(matchReadiness.clubId, a.id))).get()!;
    expect(siap().playersReady).toBe(5);

    // Siap butuh minimal 5 (mini). Turun di bawah batas → dicabut otomatis.
    expect((await aturKesiapan(a.adminId, matchId, { siap: true }, NOW)).ok).toBe(true);
    expect((await simpanRsvp(pemain[0], matchId, "tidak", NOW)).ok).toBe(true);
    expect(siap()).toMatchObject({ playersReady: 4, isReady: false });
    expect((await aturKesiapan(a.adminId, matchId, { siap: true }, NOW))).toMatchObject({ ok: false, error: expect.stringMatching(/minimal 5/) });

    // Override manual, lalu terkunci 2 jam sebelum kick-off.
    expect((await aturKesiapan(a.adminId, matchId, { jumlah: 7, siap: true }, NOW)).ok).toBe(true);
    expect(siap()).toMatchObject({ playersReady: 7, isReady: true, manualOverride: true });
    expect((await simpanRsvp(pemain[5], matchId, "ikut", nanti(71))).ok).toBe(false);
    expect((await aturKesiapan(a.adminId, matchId, { jumlah: 3 }, nanti(71))).ok).toBe(false);
    expect(db.select().from(rsvps).where(eq(rsvps.matchId, matchId)).all()).toHaveLength(5);
  });

  it("RSVP lewat action hanya untuk peran Pemain", async () => {
    const { matchId } = await matchTerkonfirmasi();
    await masukSebagai("club_admin");
    expect(await tangkapRedirect(() => rsvpAction(matchId, "ikut"))).toBe("/club");
  });
});

describe("chat match", () => {
  it("hanya kedua admin peserta; kata kasar disamarkan; Pemain tidak bisa", async () => {
    const { a, b, matchId } = await matchTerkonfirmasi();
    expect(kirimPesan(a.adminId, matchId, { body: "Jangan goblok ya, datang tepat waktu" }, NOW).ok).toBe(true);
    expect(kirimPesan(b.adminId, matchId, { body: "", lat: 0.51, lng: 101.44 }, NOW).ok).toBe(true);
    const c = await clubBaru();
    expect(kirimPesan(c.adminId, matchId, { body: "halo" }, NOW).ok).toBe(false);
    const isi = db.select().from(chatMessages).where(and(eq(chatMessages.matchId, matchId), eq(chatMessages.kind, "manusia"))).all();
    expect(isi[0].body).toBe("Jangan g***** ya, datang tepat waktu");
    expect(isi[1]).toMatchObject({ lat: 0.51, lng: 101.44 });
    await masukSebagai("player");
    expect(await tangkapRedirect(() => kirimPesanAction(matchId, { body: "halo" }))).toBe("/pemain");
  });

  it("chat belum ada saat masih Ditantang", async () => {
    const a = await clubBaru();
    const b = await clubBaru();
    const r = await buatMatch(a.adminId, { jenis: "tantangan", lawanClubId: b.id, format: "mini", usulan: usulan([48]) }, NOW);
    if (!r.ok) throw new Error();
    expect(kirimPesan(a.adminId, r.matchId, { body: "halo" }, NOW).ok).toBe(false);
    expect(db.select().from(scheduleProposals).where(eq(scheduleProposals.matchId, r.matchId)).all()).toHaveLength(1);
  });
});
