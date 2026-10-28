import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { eq, inArray } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import { notificationDeliveries, notificationPrefs, pushSubscriptions } from "@/db/schema";
import { ZONA } from "@/lib/waktu";

type Notif = { id: string; userId: string; trigger: string; title: string; url?: string };

// Tetap dikirim walau jam senyap / pengingat dibisukan (PRD 8.4).
const SELALU = new Set(["sengketa", "keputusan_sengketa", "pengingat_2jam"]);

let kunci: { publicKey: string; privateKey: string } | null | undefined;

/** Kunci VAPID dari env; di development dibuat sekali dan disimpan di data/vapid.json. */
export function kunciVapid() {
  if (kunci !== undefined) return kunci;
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    kunci = { publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  } else if (process.env.NODE_ENV !== "production") {
    const file = "data/vapid.json";
    if (!existsSync(file)) {
      mkdirSync("data", { recursive: true });
      writeFileSync(file, JSON.stringify(webpush.generateVAPIDKeys()));
    }
    kunci = JSON.parse(readFileSync(file, "utf8"));
  } else {
    console.error("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY belum diatur; Web Push nonaktif.");
    kunci = null;
  }
  return kunci;
}

const fmtJam = new Intl.DateTimeFormat("en-GB", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false });

/** Jam senyap dalam WIB, termasuk rentang melewati tengah malam (mis. 22:00–06:00). */
export function dalamJamSenyap(mulai: string | null, selesai: string | null, now = new Date()) {
  if (!mulai || !selesai || mulai === selesai) return false;
  const j = fmtJam.format(now);
  return mulai < selesai ? j >= mulai && j < selesai : j >= mulai || j < selesai;
}

/**
 * Kirim Web Push (VAPID) untuk notifikasi yang baru dibuat. Isi push generik: judul + tautan ke halaman privat,
 * tanpa isi chat/bukti/data admin (PRD 1). Langganan yang kedaluwarsa (404/410) dihapus.
 */
export async function kirimPush(notif: Notif[], now = new Date()) {
  if (!notif.length) return;
  const subs = db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, [...new Set(notif.map((n) => n.userId))])).all();
  if (!subs.length) return;
  const k = kunciVapid();
  if (!k) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:admin@ngebola.test", k.publicKey, k.privateKey);
  const prefs = new Map(db.select().from(notificationPrefs).where(inArray(notificationPrefs.userId, notif.map((n) => n.userId))).all().map((p) => [p.userId, p]));

  for (const n of notif) {
    const p = prefs.get(n.userId);
    const selalu = SELALU.has(n.trigger);
    if (p && !p.pushEnabled && !selalu) continue;
    if (p && !selalu && (dalamJamSenyap(p.quietStart, p.quietEnd, now) || (p.muteReminders && n.trigger.startsWith("pengingat")))) continue;
    for (const s of subs.filter((x) => x.userId === n.userId)) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: n.title, url: n.url ?? "/", tag: n.id }), { TTL: 6 * 3600 });
        db.insert(notificationDeliveries).values({ notificationId: n.id, channel: "push", status: "terkirim", sentAt: new Date() }).run();
      } catch (e) {
        const kode = (e as { statusCode?: number }).statusCode;
        if (kode === 404 || kode === 410) db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id)).run();
        db.insert(notificationDeliveries).values({ notificationId: n.id, channel: "push", status: "gagal", error: String(kode ?? (e as Error).message).slice(0, 200) }).run();
      }
    }
  }
}
