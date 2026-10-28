import "server-only";
import { redirect } from "next/navigation";
import type { Peran } from "@/db/enums";
import { getCurrentUser } from "./auth/session";
import type { SessionUser } from "./auth/service";

export const BERANDA_PERAN: Record<Peran, string> = {
  club_admin: "/club",
  player: "/pemain",
  platform_admin: "/platform",
};

/** Wajib masuk; tanpa sesi diarahkan ke /masuk. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  return user;
}

/** Wajib masuk dengan salah satu peran; peran lain diarahkan ke berandanya sendiri. */
export async function requireRole(...roles: Peran[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(BERANDA_PERAN[user.role]);
  return user;
}

/** Untuk halaman tamu (masuk/daftar): yang sudah masuk diarahkan ke berandanya. */
export async function redirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user) redirect(BERANDA_PERAN[user.role]);
}
