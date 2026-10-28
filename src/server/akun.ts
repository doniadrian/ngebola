import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, notificationPrefs, notifications, players, rsvps, users } from "@/db/schema";
import { hapusBerkas } from "./berkas";
import { revokeAllSessions } from "./auth/service";
import { verifyPassword } from "./auth/crypto";
import { keluarSkuad } from "./skuad";

type Hasil = { ok: true } | { ok: false; error: string };

/**
 * Hak hapus akun Pemain (UU PDP, PRD 11.2): data pribadi dihapus/dianonimkan, riwayat match & hasil tetap tanpa identitas.
 * Admin club dan Admin platform menghapus akun lewat Admin platform karena terkait club dan log audit.
 */
export async function hapusAkunPemain(userId: string, password: string, now = new Date()): Promise<Hasil> {
  const u = db.select().from(users).where(eq(users.id, userId)).get();
  if (!u || u.role !== "player" || u.deletedAt) return { ok: false, error: "Akun tidak ditemukan." };
  if (!(await verifyPassword(password, u.passwordHash))) return { ok: false, error: "Password salah." };

  await keluarSkuad(userId, now); // RSVP mendatang dihapus, admin club diberi tahu; tidak apa-apa bila belum punya club
  const foto = db.select({ p: players.photoPath }).from(players).where(eq(players.userId, userId)).get()?.p;
  db.transaction((tx) => {
    tx.delete(rsvps).where(eq(rsvps.playerUserId, userId)).run();
    tx.delete(notifications).where(eq(notifications.userId, userId)).run();
    tx.delete(notificationPrefs).where(eq(notificationPrefs.userId, userId)).run();
    tx.update(players).set({ photoPath: null, position: null, dominantFoot: null, area: null, updatedAt: now }).where(eq(players.userId, userId)).run();
    tx.update(users)
      .set({ name: "Pengguna terhapus", email: `terhapus-${userId}@ngebola.invalid`, passwordHash: null, birthDate: null, status: "nonaktif", deletedAt: now, updatedAt: now })
      .where(eq(users.id, userId))
      .run();
    tx.insert(auditLogs).values({ actorUserId: userId, action: "hapus_akun", targetType: "user", targetId: userId, reason: "Permintaan sendiri (hak hapus UU PDP)", createdAt: now }).run();
  });
  revokeAllSessions(userId); // sekaligus mencabut langganan push
  hapusBerkas(foto);
  return { ok: true };
}
