"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { players, users } from "@/db/schema";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { fieldErrors, profilPemainSchema } from "@/lib/validasi";
import { requireRole } from "@/server/authz";
import { fileDari, hapusBerkas, simpanGambar } from "@/server/berkas";

/** Profil pemain sendiri (P-01): nama, foto (≤ 2 MB), posisi, kaki dominan, area. */
export async function simpanProfilPemainAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("player");
  const values = nilaiForm(fd);
  const parsed = profilPemainSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const lama = db.select({ photoPath: players.photoPath }).from(players).where(eq(players.userId, user.id)).get();
  let photoPath = lama?.photoPath ?? null;
  const foto = fileDari(fd, "foto");
  if (foto) {
    const up = await simpanGambar(foto, "pemain");
    if (!up.ok) return { fieldErrors: { foto: up.error }, values };
    photoPath = up.path;
  }
  if (fd.get("hapusFoto") === "1") photoPath = null;

  const now = new Date();
  db.transaction((tx) => {
    tx.update(users).set({ name: parsed.data.name, updatedAt: now }).where(eq(users.id, user.id)).run();
    tx.update(players)
      .set({ photoPath, position: parsed.data.position ?? null, dominantFoot: parsed.data.dominantFoot ?? null, area: parsed.data.area ?? null, updatedAt: now })
      .where(eq(players.userId, user.id))
      .run();
  });
  if (lama?.photoPath && lama.photoPath !== photoPath) hapusBerkas(lama.photoPath);
  revalidatePath("/pemain", "layout");
  return { ok: true, message: "Profil tersimpan.", values: { ...values, name: parsed.data.name } };
}
