import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, clubs, matches, notifications, players, rsvps, sessions, squadMemberships, users } from "@/db/schema";
import { daftarAction, masukAction } from "@/server/actions/auth";
import { hapusAkunAction } from "@/server/actions/akun";
import { hapusAkunPemain } from "@/server/akun";
import { createSession, createUser, getSessionUser } from "@/server/auth/service";
import { VERSI_DOKUMEN } from "@/lib/hukum";
import { JAM } from "@/lib/waktu";
import { masukSebagai } from "./akun";
import { cookieJar, formData, tangkapRedirect } from "./helpers";

const PW = "rahasia-kuat-123";
let n = 0;
const form = (o: Record<string, string> = {}) =>
  formData({ role: "player", name: "Rizky", email: `priv${++n}@contoh.id`, birthDate: "1996-02-02", password: PW, confirmPassword: PW, ...o });

beforeEach(() => cookieJar.clear());

describe("persetujuan saat daftar (UU PDP)", () => {
  it("wajib dicentang; tanpa itu akun tidak dibuat", async () => {
    const fd = form();
    const r = await daftarAction({}, fd);
    expect(r.fieldErrors?.setuju).toMatch(/persetujuan/);
    expect(db.select().from(users).where(eq(users.email, String(fd.get("email")))).get()).toBeUndefined();
  });

  it("waktu dan versi dokumen yang disetujui tersimpan", async () => {
    const fd = form({ setuju: "on" });
    await tangkapRedirect(() => daftarAction({}, fd));
    const u = db.select().from(users).where(eq(users.email, String(fd.get("email")))).get()!;
    expect(u.consentVersion).toBe(VERSI_DOKUMEN);
    expect(u.consentAt).toBeInstanceOf(Date);
  });
});

describe("hapus akun pemain (hak hapus)", () => {
  async function pemainDenganData() {
    const adminId = (await createUser({ email: `adm${++n}@contoh.id`, password: PW, name: "Admin", role: "club_admin" }) as { userId: string }).userId;
    const clubId = crypto.randomUUID();
    db.insert(clubs).values({ id: clubId, adminUserId: adminId, slug: `priv-${n}`, name: `Club P${n}`, nameKey: `clubp${n}`, area: "Sail", level: "menengah", initials: "CP", squadCode: `P${String(n).padStart(5, "0")}`, registrationStatus: "disetujui" }).run();
    const userId = await masukSebagai("player", "Rizky Akbar");
    db.update(players).set({ position: "kiper", area: "Sail", photoPath: null }).where(eq(players.userId, userId)).run();
    db.insert(squadMemberships).values({ playerUserId: userId, clubId, status: "aktif", via: "kode" }).run();
    const m = crypto.randomUUID();
    db.insert(matches).values({ id: m, type: "tantangan", format: "mini", status: "terkonfirmasi", creatorClubId: clubId, area: "Sail", level: "menengah", scheduledAt: new Date(Date.now() + 48 * JAM), createdBy: adminId }).run();
    db.insert(rsvps).values({ matchId: m, playerUserId: userId, clubId, answer: "ikut" }).run();
    db.insert(notifications).values({ userId, trigger: "x", title: "Halo" }).run();
    return { userId, clubId, matchId: m, adminId };
  }

  it("password salah ditolak dan tidak ada yang berubah", async () => {
    const { userId } = await pemainDenganData();
    expect(await hapusAkunPemain(userId, "salah-sekali")).toEqual({ ok: false, error: "Password salah." });
    expect(db.select().from(users).where(eq(users.id, userId)).get()?.deletedAt).toBeNull();
  });

  it("data pribadi dianonimkan, sesi dicabut, keluar skuad, RSVP & notifikasi dihapus; match tetap ada", async () => {
    const { userId, matchId, adminId } = await pemainDenganData();
    const email = db.select().from(users).where(eq(users.id, userId)).get()!.email;
    const token = createSession(userId, null).token;
    expect(await hapusAkunPemain(userId, PW)).toEqual({ ok: true });

    const u = db.select().from(users).where(eq(users.id, userId)).get()!;
    expect(u).toMatchObject({ name: "Pengguna terhapus", passwordHash: null, birthDate: null, status: "nonaktif" });
    expect(u.email).not.toBe(email);
    expect(u.email).toMatch(/@ngebola\.invalid$/);
    expect(u.deletedAt).toBeInstanceOf(Date);
    expect(getSessionUser(token)).toBeNull();
    expect(db.select().from(sessions).where(eq(sessions.userId, userId)).all()).toHaveLength(0);
    expect(db.select().from(players).where(eq(players.userId, userId)).get()).toMatchObject({ position: null, area: null, photoPath: null });
    expect(db.select().from(squadMemberships).where(eq(squadMemberships.playerUserId, userId)).get()?.status).toBe("keluar");
    expect(db.select().from(rsvps).where(eq(rsvps.playerUserId, userId)).all()).toHaveLength(0);
    expect(db.select().from(notifications).where(eq(notifications.userId, userId)).all()).toHaveLength(0);
    expect(db.select().from(matches).where(eq(matches.id, matchId)).get()).toBeDefined();
    expect(db.select().from(auditLogs).where(eq(auditLogs.targetId, userId)).all().some((a) => a.action === "hapus_akun")).toBe(true);
    // Admin club diberi tahu pemain keluar skuad.
    expect(db.select().from(notifications).where(eq(notifications.userId, adminId)).all().some((x) => x.trigger === "keluar_skuad")).toBe(true);
    // Tidak bisa masuk lagi, dan email lamanya bebas dipakai daftar ulang.
    expect((await masukAction({}, formData({ email, password: PW }))).error).toBe("Email atau password salah.");
    expect(await hapusAkunPemain(userId, PW)).toMatchObject({ ok: false });
  });

  it("action: hanya Pemain; sukses mengakhiri sesi dan mengarahkan ke /masuk", async () => {
    await masukSebagai("club_admin");
    expect(await tangkapRedirect(() => hapusAkunAction({}, formData({ password: PW })))).toBe("/club");
    await pemainDenganData();
    expect((await hapusAkunAction({}, formData({ password: "salah" }))).error).toBe("Password salah.");
    expect(await tangkapRedirect(() => hapusAkunAction({}, formData({ password: PW })))).toBe("/masuk?akun=dihapus");
    expect(cookieJar.size).toBe(0);
  });
});
