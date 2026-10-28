"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AKUN_DEMO, DEMO_AKTIF } from "@/lib/demo";
import { startSession } from "@/server/auth/session";
import { BERANDA_PERAN } from "@/server/authz";

/** Masuk tanpa password, hanya untuk akun seed daftar putih dan hanya saat mode demo aktif. */
export async function masukDemoAction(fd: FormData) {
  const email = String(fd.get("email") ?? "");
  if (!DEMO_AKTIF || !AKUN_DEMO.some((a) => a.email === email)) redirect("/masuk");
  const u = db.select().from(users).where(eq(users.email, email)).get();
  if (!u || u.status !== "aktif") redirect("/masuk");
  await startSession(u.id);
  redirect(BERANDA_PERAN[u.role]);
}
