import "server-only";
import { and, count, eq, gt, inArray, isNull, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, players, pushSubscriptions, rateLimitEvents, sessions, users } from "@/db/schema";
import type { Peran } from "@/db/enums";
import { HARI, JAM, MENIT } from "@/lib/waktu";
import { hashPassword, randomToken, sha256, verifyPassword } from "./crypto";

export const SESI_BERLAKU_MS = 30 * HARI;
export const RESET_BERLAKU_MS = 30 * MENIT;
export const BATAS_RESET_PER_EMAIL = 5;
export const BATAS_RESET_GLOBAL = 60;
export const BATAS_LOGIN_GAGAL = 10;

export type SessionUser = { id: string; name: string; email: string; role: Peran; sessionId: string };

// ── Batas laju ───────────────────────────────────────────────────────────────

function hitungKejadian(bucket: string, sejak: Date) {
  const [row] = db
    .select({ n: count() })
    .from(rateLimitEvents)
    .where(and(eq(rateLimitEvents.bucket, bucket), gt(rateLimitEvents.createdAt, sejak)))
    .all();
  return row.n;
}

function catatKejadian(bucket: string, now: Date) {
  db.insert(rateLimitEvents).values({ bucket, createdAt: now }).run();
}

// ── Akun ─────────────────────────────────────────────────────────────────────

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: Peran;
  birthDate?: string | null;
  /** Versi dokumen yang disetujui saat daftar; kosong untuk akun internal (seed, Admin platform). */
  consentVersion?: string;
  now?: Date;
}): Promise<{ ok: true; userId: string } | { ok: false; error: "email_terpakai" }> {
  const now = input.now ?? new Date();
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);
  return db.transaction((tx) => {
    const ada = tx.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
    if (ada) return { ok: false as const, error: "email_terpakai" as const };
    const userId = crypto.randomUUID();
    tx.insert(users)
      .values({ id: userId, email, passwordHash, name: input.name.trim(), role: input.role, birthDate: input.birthDate ?? null, consentAt: input.consentVersion ? now : null, consentVersion: input.consentVersion ?? null, createdAt: now, updatedAt: now })
      .run();
    if (input.role === "player") {
      tx.insert(players).values({ userId, avatarSeed: crypto.randomUUID(), updatedAt: now }).run();
    }
    return { ok: true as const, userId };
  });
}

export async function authenticate(
  emailInput: string,
  password: string,
  now = new Date(),
): Promise<{ ok: true; userId: string; role: Peran } | { ok: false; error: "salah" | "terlalu_sering" | "nonaktif" }> {
  const email = emailInput.trim().toLowerCase();
  const bucket = `login:${email}`;
  if (hitungKejadian(bucket, new Date(now.getTime() - JAM)) >= BATAS_LOGIN_GAGAL) {
    return { ok: false, error: "terlalu_sering" };
  }
  const user = db.select().from(users).where(eq(users.email, email)).get();
  const cocok = await verifyPassword(password, user?.deletedAt ? null : (user?.passwordHash ?? null));
  if (!user || !cocok) {
    catatKejadian(bucket, now);
    return { ok: false, error: "salah" };
  }
  if (user.status !== "aktif") return { ok: false, error: "nonaktif" };
  return { ok: true, userId: user.id, role: user.role };
}

// ── Sesi ─────────────────────────────────────────────────────────────────────

export function createSession(userId: string, userAgent: string | null, now = new Date()) {
  const token = randomToken();
  const expiresAt = new Date(now.getTime() + SESI_BERLAKU_MS);
  db.insert(sessions).values({ tokenHash: sha256(token), userId, userAgent, createdAt: now, expiresAt }).run();
  return { token, expiresAt };
}

export function getSessionUser(token: string, now = new Date()): SessionUser | null {
  const row = db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      deletedAt: users.deletedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, sha256(token)))
    .get();
  if (!row || row.expiresAt <= now || row.status !== "aktif" || row.deletedAt) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role, sessionId: row.sessionId };
}

// Langganan push terikat sesi (PRD 1): dicabut bersama sesinya.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
function hapusSesi(tx: Tx, where: SQL) {
  const ids = tx.select({ id: sessions.id }).from(sessions).where(where).all().map((s) => s.id);
  if (ids.length === 0) return;
  tx.delete(pushSubscriptions).where(inArray(pushSubscriptions.sessionId, ids)).run();
  tx.delete(sessions).where(inArray(sessions.id, ids)).run();
}

export function revokeSession(token: string) {
  db.transaction((tx) => hapusSesi(tx, eq(sessions.tokenHash, sha256(token))));
}

export function revokeAllSessions(userId: string) {
  db.transaction((tx) => hapusSesi(tx, eq(sessions.userId, userId)));
}

// ── Lupa & reset password (PRD 4.1) ─────────────────────────────────────────

/**
 * Selalu dianggap berhasil oleh pemanggil (respons umum). Mengembalikan token hanya bila email
 * perlu dikirim: akun ada, aktif, dan batas laju belum terlampaui.
 */
export function requestPasswordReset(emailInput: string, now = new Date()): { token: string; email: string; name: string } | null {
  const email = emailInput.trim().toLowerCase();
  const sejam = new Date(now.getTime() - JAM);
  const bucketEmail = `reset:${sha256(email)}`;
  if (hitungKejadian(bucketEmail, sejam) >= BATAS_RESET_PER_EMAIL) return null;
  if (hitungKejadian("reset:global", sejam) >= BATAS_RESET_GLOBAL) return null;
  catatKejadian(bucketEmail, now);
  catatKejadian("reset:global", now);

  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user || user.status !== "aktif" || user.deletedAt) return null;

  const token = randomToken();
  db.insert(passwordResetTokens)
    .values({ userId: user.id, tokenHash: sha256(token), expiresAt: new Date(now.getTime() + RESET_BERLAKU_MS), createdAt: now })
    .run();
  return { token, email: user.email, name: user.name };
}

function cariTokenReset(token: string, now: Date) {
  const row = db
    .select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId, status: users.status, deletedAt: users.deletedAt })
    .from(passwordResetTokens)
    .innerJoin(users, eq(users.id, passwordResetTokens.userId))
    .where(and(eq(passwordResetTokens.tokenHash, sha256(token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, now)))
    .get();
  return row && row.status === "aktif" && !row.deletedAt ? row : null;
}

export const isResetTokenValid = (token: string, now = new Date()) => cariTokenReset(token, now) !== null;

export async function resetPassword(token: string, newPassword: string, now = new Date()): Promise<boolean> {
  if (!cariTokenReset(token, now)) return false;
  const passwordHash = await hashPassword(newPassword);
  return db.transaction((tx) => {
    // Cek ulang di dalam transaksi supaya token tidak bisa dipakai dua kali secara bersamaan.
    const row = tx
      .select({ userId: passwordResetTokens.userId })
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.tokenHash, sha256(token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, now)))
      .get();
    if (!row) return false;
    tx.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, row.userId)).run();
    // Reset sukses mencabut semua tautan reset dan semua sesi akun ini.
    tx.update(passwordResetTokens).set({ usedAt: now }).where(and(eq(passwordResetTokens.userId, row.userId), isNull(passwordResetTokens.usedAt))).run();
    hapusSesi(tx, eq(sessions.userId, row.userId));
    return true;
  });
}
