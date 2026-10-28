import "server-only";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notificationPrefs, notifications, pushSubscriptions } from "@/db/schema";

export const daftarNotifikasi = (userId: string, batas = 50) => db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(batas).all();

export const jumlahBelumDibaca = (userId: string) => db.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt))).get()?.n ?? 0;

export const preferensi = (userId: string) => db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId)).get() ?? { userId, pushEnabled: true, quietStart: null, quietEnd: null, muteReminders: false };

export const langgananSesi = (sessionId: string) => !!db.select({ id: pushSubscriptions.id }).from(pushSubscriptions).where(eq(pushSubscriptions.sessionId, sessionId)).get();
