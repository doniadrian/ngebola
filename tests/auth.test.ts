import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, players, rateLimitEvents, sessions, users } from "@/db/schema";
import { daftarAction, keluarAction, lupaPasswordAction, masukAction, resetPasswordAction } from "@/server/actions/auth";
import {
  authenticate,
  BATAS_LOGIN_GAGAL,
  createSession,
  createUser,
  getSessionUser,
  isResetTokenValid,
  requestPasswordReset,
  resetPassword,
} from "@/server/auth/service";
import { sha256 } from "@/server/auth/crypto";
import { COOKIE_SESI } from "@/server/auth/session";
import { umur } from "@/lib/waktu";
import { cookieJar, formData, tangkapRedirect } from "./helpers";

const PW = "rahasia-kuat-123";
let n = 0;
const emailBaru = () => `orang${++n}@contoh.id`;

const daftarForm = (o: Record<string, string> = {}) =>
  formData({ role: "club_admin", name: "Dimas Pratama", email: emailBaru(), birthDate: "1995-05-10", password: PW, confirmPassword: PW, setuju: "on", ...o });

beforeEach(() => {
  cookieJar.clear();
  db.delete(rateLimitEvents).run();
});

describe("umur (WIB)", () => {
  it("menghitung ulang tahun pada tanggal WIB, bukan UTC", () => {
    // 2026-10-27 18:00 UTC = 2026-10-28 01:00 WIB
    const now = new Date("2026-10-27T18:00:00Z");
    expect(umur("2009-10-28", now)).toBe(17);
    expect(umur("2009-10-29", now)).toBe(16);
  });
});

describe("daftar", () => {
  it("membuat Admin club, memulai sesi, dan mengarahkan ke /club", async () => {
    const fd = daftarForm();
    const url = await tangkapRedirect(() => daftarAction({}, fd));
    expect(url).toBe("/club");
    const user = db.select().from(users).where(eq(users.email, String(fd.get("email")))).get()!;
    expect(user.role).toBe("club_admin");
    expect(user.passwordHash).not.toContain(PW);
    expect(user.passwordHash).toMatch(/^scrypt\$/);
    const token = cookieJar.get(COOKIE_SESI)!;
    expect(getSessionUser(token)?.id).toBe(user.id);
    // DB hanya menyimpan hash token sesi.
    expect(db.select().from(sessions).where(eq(sessions.tokenHash, token)).get()).toBeUndefined();
  });

  it("membuat Pemain beserta baris profil pemain dan mengarahkan ke /pemain", async () => {
    const fd = daftarForm({ role: "player" });
    expect(await tangkapRedirect(() => daftarAction({}, fd))).toBe("/pemain");
    const user = db.select().from(users).where(eq(users.email, String(fd.get("email")))).get()!;
    expect(db.select().from(players).where(eq(players.userId, user.id)).get()).toBeDefined();
  });

  it("menolak peran Admin platform dari pendaftaran publik", async () => {
    const res = await daftarAction({}, daftarForm({ role: "platform_admin" }));
    expect(res.fieldErrors?.role).toBeDefined();
    expect(db.select().from(users).where(eq(users.role, "platform_admin")).all()).toHaveLength(0);
  });

  it("menolak umur di bawah 17 tahun", async () => {
    const res = await daftarAction({}, daftarForm({ birthDate: "2015-01-01" }));
    expect(res.fieldErrors?.birthDate).toMatch(/17/);
  });

  it("menolak password kurang dari 10 atau lebih dari 128 karakter, dan konfirmasi yang beda", async () => {
    expect((await daftarAction({}, daftarForm({ password: "pendek", confirmPassword: "pendek" }))).fieldErrors?.password).toMatch(/10/);
    const panjang = "a".repeat(129);
    expect((await daftarAction({}, daftarForm({ password: panjang, confirmPassword: panjang }))).fieldErrors?.password).toMatch(/128/);
    expect((await daftarAction({}, daftarForm({ confirmPassword: "lain-sekali-123" }))).fieldErrors?.confirmPassword).toBeDefined();
  });

  it("menolak email yang sudah terdaftar (tanpa beda huruf besar/kecil) dan tidak mengembalikan password", async () => {
    const email = emailBaru();
    await createUser({ email, password: PW, name: "A", role: "player" });
    const res = await daftarAction({}, daftarForm({ email: email.toUpperCase() }));
    expect(res.fieldErrors?.email).toMatch(/sudah terdaftar/);
    expect(JSON.stringify(res)).not.toContain(PW);
  });
});

describe("masuk & keluar", () => {
  it("mengarahkan tiap peran ke berandanya", async () => {
    for (const [role, home] of [["club_admin", "/club"], ["player", "/pemain"], ["platform_admin", "/platform"]] as const) {
      const email = emailBaru();
      await createUser({ email, password: PW, name: "X", role });
      expect(await tangkapRedirect(() => masukAction({}, formData({ email, password: PW })))).toBe(home);
    }
  });

  it("parameter lanjut hanya menerima path internal (cegah open redirect)", async () => {
    const email = emailBaru();
    await createUser({ email, password: PW, name: "X", role: "player" });
    const coba = async (lanjut: string) => {
      cookieJar.clear();
      return tangkapRedirect(() => masukAction({}, formData({ email, password: PW, lanjut })));
    };
    expect(await coba("/undangan/abc")).toBe("/undangan/abc");
    expect(await coba("//evil.example")).toBe("/pemain");
    expect(await coba("/\\evil.example")).toBe("/pemain");
    expect(await coba("https://evil.example")).toBe("/pemain");
  });

  it("memberi pesan umum untuk email tidak dikenal maupun password salah", async () => {
    const email = emailBaru();
    await createUser({ email, password: PW, name: "X", role: "player" });
    const a = await masukAction({}, formData({ email, password: "salah-password" }));
    const b = await masukAction({}, formData({ email: "tidakada@contoh.id", password: PW }));
    expect(a.error).toBe("Email atau password salah.");
    expect(b.error).toBe(a.error);
    expect(cookieJar.has(COOKIE_SESI)).toBe(false);
  });

  it(`mengunci login setelah ${BATAS_LOGIN_GAGAL} kali gagal dalam sejam`, async () => {
    const email = emailBaru();
    await createUser({ email, password: PW, name: "X", role: "player" });
    const now = new Date();
    for (let i = 0; i < BATAS_LOGIN_GAGAL; i++) await authenticate(email, "salah-password", now);
    expect(await authenticate(email, PW, now)).toEqual({ ok: false, error: "terlalu_sering" });
    expect((await authenticate(email, PW, new Date(now.getTime() + 61 * 60_000))).ok).toBe(true);
  });

  it("menolak akun nonaktif", async () => {
    const email = emailBaru();
    const r = await createUser({ email, password: PW, name: "X", role: "player" });
    if (!r.ok) throw new Error();
    db.update(users).set({ status: "nonaktif" }).where(eq(users.id, r.userId)).run();
    expect(await authenticate(email, PW)).toEqual({ ok: false, error: "nonaktif" });
  });

  it("keluar menghapus sesi di DB dan cookie", async () => {
    const email = emailBaru();
    await createUser({ email, password: PW, name: "X", role: "player" });
    await tangkapRedirect(() => masukAction({}, formData({ email, password: PW })));
    const token = cookieJar.get(COOKIE_SESI)!;
    expect(await tangkapRedirect(() => keluarAction())).toBe("/masuk");
    expect(cookieJar.has(COOKIE_SESI)).toBe(false);
    expect(getSessionUser(token)).toBeNull();
  });

  it("sesi kedaluwarsa tidak berlaku", async () => {
    const r = await createUser({ email: emailBaru(), password: PW, name: "X", role: "player" });
    if (!r.ok) throw new Error();
    const now = new Date();
    const { token } = createSession(r.userId, null, now);
    expect(getSessionUser(token, now)).not.toBeNull();
    expect(getSessionUser(token, new Date(now.getTime() + 31 * 24 * 3600_000))).toBeNull();
  });
});

describe("lupa & reset password", () => {
  async function akun(role: "player" | "club_admin" = "player") {
    const email = emailBaru();
    const r = await createUser({ email, password: PW, name: "Rizky", role });
    if (!r.ok) throw new Error();
    return { email, userId: r.userId };
  }

  it("memberi respons yang sama untuk email terdaftar dan tidak terdaftar", async () => {
    const { email } = await akun();
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const a = await lupaPasswordAction({}, formData({ email }));
    const b = await lupaPasswordAction({}, formData({ email: "tidakada@contoh.id" }));
    expect(a.message).toBe(b.message);
    expect(a.ok && b.ok).toBe(true);
    // Mode demo: tautan dicetak di terminal, hanya untuk akun yang ada.
    expect(log).toHaveBeenCalledTimes(1);
    expect(String(log.mock.calls[0][0])).toMatch(/\/reset-password\/[A-Za-z0-9_-]{43}/);
    log.mockRestore();
  });

  it("menyimpan token sebagai hash, berlaku 30 menit, dan sekali pakai", async () => {
    const { email, userId } = await akun();
    const now = new Date();
    const r = requestPasswordReset(email, now)!;
    const row = db.select().from(passwordResetTokens).where(eq(passwordResetTokens.userId, userId)).get()!;
    expect(row.tokenHash).toBe(sha256(r.token));
    expect(row.tokenHash).not.toBe(r.token);
    expect(row.expiresAt.getTime() - now.getTime()).toBe(30 * 60_000);
    expect(isResetTokenValid(r.token, new Date(now.getTime() + 31 * 60_000))).toBe(false);
    expect(await resetPassword(r.token, "password-baru-123", new Date(now.getTime() + 31 * 60_000))).toBe(false);
    expect(await resetPassword(r.token, "password-baru-123", now)).toBe(true);
    expect(await resetPassword(r.token, "password-lain-456", now)).toBe(false);
  });

  it("reset sukses mencabut semua sesi dan tautan lain, peran tidak berubah", async () => {
    const { email, userId } = await akun("club_admin");
    const s1 = createSession(userId, null);
    const s2 = createSession(userId, null);
    const t1 = requestPasswordReset(email)!.token;
    const t2 = requestPasswordReset(email)!.token;
    expect(await resetPassword(t1, "password-baru-123")).toBe(true);
    expect(getSessionUser(s1.token)).toBeNull();
    expect(getSessionUser(s2.token)).toBeNull();
    expect(isResetTokenValid(t2)).toBe(false);
    expect(db.select().from(users).where(eq(users.id, userId)).get()!.role).toBe("club_admin");
    expect((await authenticate(email, "password-baru-123")).ok).toBe(true);
    expect((await authenticate(email, PW)).ok).toBe(false);
  });

  it("membatasi 5 permintaan per email per jam", async () => {
    const { email } = await akun();
    const now = new Date();
    for (let i = 0; i < 5; i++) expect(requestPasswordReset(email, now)).not.toBeNull();
    expect(requestPasswordReset(email, now)).toBeNull();
    expect(requestPasswordReset(email, new Date(now.getTime() + 61 * 60_000))).not.toBeNull();
  });

  it("membatasi 60 permintaan global per jam", async () => {
    const now = new Date();
    for (let i = 0; i < 60; i++) requestPasswordReset(`acak${i}@contoh.id`, now);
    const { email } = await akun();
    expect(requestPasswordReset(email, now)).toBeNull();
  });

  it("akun nonaktif tidak dapat direset", async () => {
    const { email, userId } = await akun();
    const token = requestPasswordReset(email)!.token;
    db.update(users).set({ status: "nonaktif" }).where(eq(users.id, userId)).run();
    expect(requestPasswordReset(email)).toBeNull();
    expect(await resetPassword(token, "password-baru-123")).toBe(false);
  });

  it("form reset memvalidasi panjang dan konfirmasi, lalu mengarahkan ke /masuk", async () => {
    const { email } = await akun();
    const token = requestPasswordReset(email)!.token;
    const bad = await resetPasswordAction(token, {}, formData({ password: "pendek", confirmPassword: "pendek" }));
    expect(bad.fieldErrors?.password).toBeDefined();
    const url = await tangkapRedirect(() =>
      resetPasswordAction(token, {}, formData({ password: "password-baru-123", confirmPassword: "password-baru-123" })),
    );
    expect(url).toBe("/masuk?reset=berhasil");
  });
});
