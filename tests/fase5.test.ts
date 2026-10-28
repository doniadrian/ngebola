import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, chatMessages, clubs, matches, matchReadiness, moderationFlags, notifications, platformSettings, reminderLog, reports, resultConfirmations, reviews, rsvps, squadMemberships, users } from "@/db/schema";
import { createSession, createUser, getSessionUser } from "@/server/auth/service";
import { beriPenilaian } from "@/server/hari-h";
import { dalamJamSenyap } from "@/server/notify/push";
import { prosesPengingat } from "@/server/pengingat";
import { aturStatusAkun, simpanPengaturan, tangguhkanClub, tindakLaporan } from "@/server/platform";
import { HARI, JAM } from "@/lib/waktu";
import { cookieJar } from "./helpers";

const NOW = new Date("2026-11-02T03:00:00Z");
let n = 0;

async function akun(role: "club_admin" | "player" | "platform_admin") {
  const r = await createUser({ email: `f5-${++n}-${Date.now()}@contoh.id`, password: "rahasia-kuat-123", name: `U${n}`, role });
  if (!r.ok) throw new Error();
  return r.userId;
}
async function club() {
  const adminId = await akun("club_admin");
  const id = crypto.randomUUID();
  db.insert(clubs).values({ id, adminUserId: adminId, slug: `f5-${n}`, name: `Club F${n}`, nameKey: `clubf${n}`, area: "Sail", level: "menengah", initials: "CF", squadCode: `F${String(n).padStart(5, "0")}`, registrationStatus: "disetujui" }).run();
  return { id, adminId };
}
function match(a: string, b: string, status: "terkonfirmasi" | "menunggu_hasil" | "selesai", at: Date, adminId: string) {
  const id = crypto.randomUUID();
  db.insert(matches).values({ id, type: "tantangan", format: "mini", status, creatorClubId: a, opponentClubId: b, area: "Sail", level: "menengah", scheduledAt: at, createdBy: adminId, endedAt: status === "selesai" ? at : null }).run();
  return id;
}
const notif = (userId: string, trigger: string) => db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.trigger, trigger))).all();

beforeEach(() => cookieJar.clear());

describe("pengingat (S-03, P-06, R-04, H-05)", () => {
  it("hanya ambang terdekat, idempoten, pemain yang menjawab 'tidak' dilewati, club belum siap diumumkan di chat", async () => {
    const a = await club();
    const b = await club();
    const ikut = await akun("player");
    const tidak = await akun("player");
    for (const p of [ikut, tidak]) db.insert(squadMemberships).values({ playerUserId: p, clubId: a.id, status: "aktif", via: "kode" }).run();
    const id = match(a.id, b.id, "terkonfirmasi", new Date(NOW.getTime() + 20 * JAM), a.adminId);
    db.insert(rsvps).values({ matchId: id, playerUserId: tidak, clubId: a.id, answer: "tidak" }).run();
    db.insert(matchReadiness).values({ matchId: id, clubId: b.id, isReady: true, playersReady: 6 }).run();

    await prosesPengingat(NOW);
    await prosesPengingat(new Date(NOW.getTime() + 5 * 60_000));
    expect(notif(a.adminId, "pengingat_h1")).toHaveLength(1);
    expect(notif(a.adminId, "pengingat_h3")).toHaveLength(0);
    expect(notif(ikut, "pengingat_h1")).toHaveLength(1);
    expect(notif(tidak, "pengingat_h1")).toHaveLength(0);
    const sistem = db.select().from(chatMessages).where(eq(chatMessages.matchId, id)).all().map((m) => m.body);
    expect(sistem.filter((s) => s.includes("belum menandai siap"))).toHaveLength(1);
    expect(sistem[0]).toContain(`Club F`);

    await prosesPengingat(new Date(NOW.getTime() + 18.5 * JAM));
    expect(notif(a.adminId, "pengingat_2jam")).toHaveLength(1);
    expect(db.select().from(reminderLog).where(eq(reminderLog.matchId, id)).all().length).toBe(6);
  });

  it("lawan pengusul mendapat 2 pengingat sebelum tenggat konfirmasi hasil", async () => {
    const a = await club();
    const b = await club();
    const id = match(a.id, b.id, "menunggu_hasil", new Date(NOW.getTime() - 2 * JAM), a.adminId);
    db.insert(resultConfirmations).values({ matchId: id, proposerClubId: a.id, creatorScore: 1, opponentScore: 0, proposedAt: NOW, deadline: new Date(NOW.getTime() + 48 * JAM) }).run();
    await prosesPengingat(new Date(NOW.getTime() + 10 * JAM));
    expect(notif(b.adminId, "pengingat_hasil")).toHaveLength(0);
    await prosesPengingat(new Date(NOW.getTime() + 25 * JAM));
    await prosesPengingat(new Date(NOW.getTime() + 26 * JAM));
    await prosesPengingat(new Date(NOW.getTime() + 45 * JAM));
    expect(notif(b.adminId, "pengingat_hasil")).toHaveLength(2);
    expect(notif(a.adminId, "pengingat_hasil")).toHaveLength(0);
    expect(db.select().from(resultConfirmations).where(eq(resultConfirmations.matchId, id)).get()?.remindersSent).toBe(2);
  });
});

describe("jam senyap (WIB)", () => {
  it("rentang melewati tengah malam", () => {
    const wib = (jam: number) => new Date(Date.UTC(2026, 10, 2, jam - 7));
    expect(dalamJamSenyap("22:00", "06:00", wib(23))).toBe(true);
    expect(dalamJamSenyap("22:00", "06:00", wib(5))).toBe(true);
    expect(dalamJamSenyap("22:00", "06:00", wib(12))).toBe(false);
    expect(dalamJamSenyap("13:00", "15:00", wib(14))).toBe(true);
    expect(dalamJamSenyap(null, null, wib(14))).toBe(false);
  });
});

describe("panel Admin platform", () => {
  it("tangguhkan club: match aktif dibatalkan tanpa penalti bagi lawan, alasan wajib, audit, tidak muncul publik", async () => {
    const pf = await akun("platform_admin");
    const a = await club();
    const b = await club();
    const id = match(a.id, b.id, "terkonfirmasi", new Date(NOW.getTime() + 5 * HARI), a.adminId);
    expect((await tangguhkanClub(pf, a.id, "pendek", NOW)).ok).toBe(false);
    expect(await tangguhkanClub(pf, a.id, "Kekerasan di lapangan, dilaporkan 3 club.", NOW)).toMatchObject({ ok: true, dibatalkan: 1 });
    expect(db.select().from(matches).where(eq(matches.id, id)).get()).toMatchObject({ status: "dibatalkan", lateCancel: false, cancelledByClubId: a.id });
    expect(db.select().from(clubs).where(eq(clubs.id, a.id)).get()?.suspendedAt).toEqual(NOW);
    expect(db.select().from(auditLogs).where(and(eq(auditLogs.targetId, a.id), eq(auditLogs.action, "tangguhkan_club"))).get()).toBeDefined();
    expect(notif(b.adminId, "match_dibatalkan")).toHaveLength(1);
  });

  it("nonaktifkan akun mencabut semua sesi; tidak bisa menonaktifkan diri sendiri", async () => {
    const pf = await akun("platform_admin");
    const u = await akun("player");
    const s = createSession(u, null);
    expect(aturStatusAkun(pf, pf, "nonaktif", "Uji coba alasan panjang").ok).toBe(false);
    expect(aturStatusAkun(pf, u, "nonaktif", "Akun ganda terdeteksi oleh tim.").ok).toBe(true);
    expect(getSessionUser(s.token)).toBeNull();
    expect(db.select().from(users).where(eq(users.id, u)).get()?.status).toBe("nonaktif");
  });

  it("tindak laporan pesan menyembunyikan pesan; tercatat di audit", async () => {
    const pf = await akun("platform_admin");
    const a = await club();
    const b = await club();
    const id = match(a.id, b.id, "terkonfirmasi", new Date(NOW.getTime() + 5 * HARI), a.adminId);
    const pesan = crypto.randomUUID();
    db.insert(chatMessages).values({ id: pesan, matchId: id, senderUserId: a.adminId, kind: "manusia", body: "kata ancaman" }).run();
    const lap = crypto.randomUUID();
    db.insert(reports).values({ id: lap, reporterUserId: b.adminId, targetType: "pesan", targetId: pesan, reason: "Ancaman" }).run();
    expect(tindakLaporan(pf, lap, "tindak", "Melanggar aturan perilaku.").ok).toBe(true);
    expect(db.select().from(chatMessages).where(eq(chatMessages.id, pesan)).get()?.hiddenByModerator).toBe(true);
    expect(tindakLaporan(pf, lap, "tolak", "Dua kali").ok).toBe(false);
  });

  it("pengaturan divalidasi rentangnya dan dipakai", async () => {
    const pf = await akun("platform_admin");
    const ok = { "rating.awal": 1200, "rating.k_baru": 32, "rating.k_lama": 24, "rating.batas_baru": 10, "match.maks_terbuka": 2 };
    expect(simpanPengaturan(pf, { ...ok, "rating.k_baru": 500 }, "Menyesuaikan volatilitas rating.").ok).toBe(false);
    expect(simpanPengaturan(pf, ok, "Menyesuaikan volatilitas rating.").ok).toBe(true);
    expect(db.select().from(platformSettings).where(eq(platformSettings.key, "rating.k_baru")).get()?.value).toBe("32");
    const { maksMatchTerbuka } = await import("@/server/match");
    expect(maksMatchTerbuka()).toBe(2);
    simpanPengaturan(pf, { ...ok, "match.maks_terbuka": 3, "rating.k_baru": 40 }, "Kembali ke nilai bawaan PRD.");
  });

  it("pola penilaian: 3 dari 5 penilaian terakhir bernilai 1 → dikecualikan & ditandai", async () => {
    const a = await club();
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const b = await club();
      const id = match(a.id, b.id, "selesai", new Date(NOW.getTime() - (i + 1) * HARI), a.adminId);
      db.update(matches).set({ finalCreatorScore: 1, finalOpponentScore: 0 }).where(eq(matches.id, id)).run();
      expect(beriPenilaian(a.adminId, id, { sportivitas: 1, kerapian: 1, komentar: null }, NOW).ok).toBe(true);
      ids.push(id);
    }
    const r = db.select().from(reviews).where(eq(reviews.reviewerClubId, a.id)).all();
    expect(r.every((x) => x.excluded)).toBe(true);
    expect(db.select().from(moderationFlags).where(and(eq(moderationFlags.clubId, a.id), eq(moderationFlags.kind, "ulasan_pola"))).get()).toBeDefined();
  });
});
