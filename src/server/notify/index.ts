import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { clubs, notificationDeliveries, notifications, users } from "@/db/schema";
import { appUrl, sendEmail } from "./email";
import { kirimPush } from "./push";

export type Kabar = {
  /** Kode pemicu (PRD 8.4), mis. "status_registrasi", "tantangan_baru". */
  trigger: string;
  title: string;
  body?: string;
  /** Tautan internal ke halaman privat. */
  url?: string;
};

/**
 * Kirim kabar ke pengguna: selalu dalam aplikasi + Web Push ke perangkat yang berlangganan; email bila `email`
 * (status registrasi, sengketa — PRD 8.4). Dipanggil setelah transaksi data selesai.
 */
export async function beritahu(userIds: string[], kabar: Kabar, opsi: { email?: boolean } = {}) {
  const unik = [...new Set(userIds)].filter(Boolean);
  if (unik.length === 0) return;
  const now = new Date();
  const baris = unik.map((userId) => ({ id: crypto.randomUUID(), userId, ...kabar, createdAt: now }));
  db.insert(notifications).values(baris).run();

  await kirimPush(baris);

  if (opsi.email) {
    const penerima = db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(inArray(users.id, unik)).all();
    for (const u of penerima) {
      const n = baris.find((b) => b.userId === u.id)!;
      const ok = await sendEmail({
        to: u.email,
        subject: kabar.title,
        text: `Halo ${u.name},\n\n${kabar.title}${kabar.body ? `\n${kabar.body}` : ""}${kabar.url ? `\n\nBuka: ${appUrl(kabar.url)}` : ""}\n\n— Ngebola`,
      });
      db.insert(notificationDeliveries).values({ notificationId: n.id, channel: "email", status: ok ? "terkirim" : "gagal", sentAt: ok ? new Date() : null }).run();
    }
  }
}

export const idAdminPlatform = () =>
  db.select({ id: users.id }).from(users).where(and(eq(users.role, "platform_admin"), eq(users.status, "aktif"))).all().map((u) => u.id);

export const idAdminClub = (clubId: string) => db.select({ id: clubs.adminUserId }).from(clubs).where(eq(clubs.id, clubId)).get()?.id;
