import type { Peran } from "@/db/enums";
import { createSession, createUser } from "@/server/auth/service";
import { COOKIE_SESI } from "@/server/auth/session";
import { cookieJar } from "./helpers";

let n = 0;

/** Buat akun baru dan jadikan sesi aktif (cookie tiruan). */
export async function masukSebagai(role: Peran, nama = "Uji") {
  const r = await createUser({ email: `u${++n}-${role}@contoh.id`, password: "rahasia-kuat-123", name: nama, role, birthDate: "1995-01-01" });
  if (!r.ok) throw new Error("gagal membuat akun");
  cookieJar.clear();
  cookieJar.set(COOKIE_SESI, createSession(r.userId, null).token);
  return r.userId;
}

export function sesiSebagai(token: string) {
  cookieJar.clear();
  cookieJar.set(COOKIE_SESI, token);
}

export const DATA_CLUB = {
  name: "Bintang Senapelan",
  area: "Senapelan",
  level: "menengah",
  foundedYear: "2020",
  description: "Club uji.",
  contactPhone: "0812 3456 7890",
  crestColor: "#123b2c",
  jerseyHome: "#123b2c",
  jerseyAway: "#fbf8f1",
};
