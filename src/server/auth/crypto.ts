import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const PANJANG_KUNCI = 64;

// Format: scrypt$<salt base64url>$<hash base64url>. Parameter scrypt bawaan Node (N=16384, r=8, p=1).
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, PANJANG_KUNCI);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const [algo, saltB64, hashB64] = (stored ?? "").split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) {
    // Tetap hitung hash agar waktu respons tidak membocorkan keberadaan akun.
    await scryptAsync(password, randomBytes(16), PANJANG_KUNCI);
    return false;
  }
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64url"), expected.length);
  return timingSafeEqual(expected, actual);
}

export const randomToken = () => randomBytes(32).toString("base64url");
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

// Kode skuad 6 karakter tanpa huruf/angka yang mirip (0/O, 1/I).
export function randomCode(length = 6) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(randomBytes(length), (b) => abc[b % abc.length]).join("");
}
