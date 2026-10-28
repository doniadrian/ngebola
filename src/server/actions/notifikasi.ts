"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notificationPrefs, notifications } from "@/db/schema";
import { teks, type FormState } from "@/lib/form-state";
import { requireUser } from "@/server/authz";

export async function tandaiSemuaDibacaAction() {
  const user = await requireUser();
  db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))).run();
  revalidatePath("/", "layout");
}

const JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Preferensi kanal & jam senyap (PRD 8.4). Sengketa & pengingat 2 jam tetap dikirim. */
export async function simpanPreferensiAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const mulai = teks(fd, "quietStart");
  const selesai = teks(fd, "quietEnd");
  const senyap = mulai && selesai && mulai !== "mati";
  if (senyap && (!JAM.test(mulai) || !JAM.test(selesai))) return { error: "Jam senyap tidak valid." };
  const nilai = {
    pushEnabled: fd.get("pushEnabled") === "on",
    muteReminders: fd.get("muteReminders") === "on",
    quietStart: senyap ? mulai : null,
    quietEnd: senyap ? selesai : null,
  };
  db.insert(notificationPrefs).values({ userId: user.id, ...nilai }).onConflictDoUpdate({ target: notificationPrefs.userId, set: nilai }).run();
  revalidatePath("/", "layout");
  return { ok: true, message: "Preferensi tersimpan." };
}
