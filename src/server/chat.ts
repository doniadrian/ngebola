import "server-only";
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, clubBlocks, clubs, matches, reports, users } from "@/db/schema";
import { HARI } from "@/lib/waktu";
import { clubMilik } from "./club";
import { peserta } from "./match";

type Hasil<T = object> = ({ ok: true } & T) | { ok: false; error: string };
type Match = typeof matches.$inferSelect;

export const MAKS_PESAN = 1000;

// Filter kata kasar sederhana (PRD 8.3): kata disamarkan, pesan tetap terkirim.
const KASAR = ["anjing", "anjeng", "bangsat", "babi", "kontol", "memek", "ngentot", "goblok", "goblog", "tolol", "kampret", "bajingan", "jancok", "jancuk", "asu", "tai", "keparat", "brengsek"];
const POLA_KASAR = new RegExp(`\\b(${KASAR.join("|")})\\b`, "gi");
export const saringKataKasar = (teks: string) => teks.replace(POLA_KASAR, (k) => k[0] + "*".repeat(k.length - 1));

/** Chat dibuat saat tantangan diterima atau tawar balik dimulai (status punya lawan & bukan Ditantang). */
export const chatAda = (m: Match) => !!m.opponentClubId && !["draf", "terbuka", "ditantang"].includes(m.status);

/** Bisa menulis: match masih berjalan, atau Selesai < 7 hari (PRD 8.3). */
export function chatTerbuka(m: Match, now = new Date()) {
  if (["dinegosiasi", "terkonfirmasi", "ditunda", "berlangsung", "menunggu_hasil", "sengketa"].includes(m.status)) return true;
  return m.status === "selesai" && now.getTime() - (m.endedAt ?? m.updatedAt).getTime() < 7 * HARI;
}

export function daftarPesan(matchId: string, setelah?: Date) {
  return db
    .select({ id: chatMessages.id, kind: chatMessages.kind, body: chatMessages.body, lat: chatMessages.lat, lng: chatMessages.lng, hidden: chatMessages.hiddenByModerator, at: chatMessages.createdAt, senderId: chatMessages.senderUserId, senderName: users.name, senderClubId: clubs.id, senderClub: clubs.name })
    .from(chatMessages)
    .leftJoin(users, eq(users.id, chatMessages.senderUserId))
    .leftJoin(clubs, eq(clubs.adminUserId, chatMessages.senderUserId))
    .where(and(eq(chatMessages.matchId, matchId), setelah ? gt(chatMessages.createdAt, setelah) : undefined))
    .orderBy(asc(chatMessages.createdAt))
    .all()
    .map((p) => ({ ...p, body: p.hidden ? "Pesan disembunyikan moderator." : p.body, lat: p.hidden ? null : p.lat, lng: p.hidden ? null : p.lng }));
}
export type Pesan = ReturnType<typeof daftarPesan>[number];

/** Hanya kedua Admin club peserta yang bisa chat; Pemain tidak (PRD 4.4). */
export function kirimPesan(adminId: string, matchId: string, input: { body: string; lat?: number; lng?: number }, now = new Date()): Hasil {
  const club = clubMilik(adminId);
  const m = db.select().from(matches).where(eq(matches.id, matchId)).get();
  if (!club || !m || !peserta(m, club.id) || !chatAda(m)) return { ok: false, error: "Chat tidak tersedia." };
  if (!chatTerbuka(m, now)) return { ok: false, error: "Chat sudah ditutup." };
  const lokasi = input.lat != null && input.lng != null && Math.abs(input.lat) <= 90 && Math.abs(input.lng) <= 180;
  const body = saringKataKasar(input.body.trim()).slice(0, MAKS_PESAN);
  if (!body && !lokasi) return { ok: false, error: "Pesan kosong." };
  db.insert(chatMessages)
    .values({ matchId, senderUserId: adminId, kind: "manusia", body: body || "Membagikan lokasi", lat: lokasi ? input.lat : null, lng: lokasi ? input.lng : null, createdAt: now })
    .run();
  return { ok: true };
}

/** Laporan pesan/ulasan/club oleh pengguna (PRD 8.3, 7.3) → antrean Admin platform. */
export function laporkan(userId: string, input: { targetType: "pesan" | "ulasan" | "club"; targetId: string; alasan: string }): Hasil {
  if (input.alasan.trim().length < 5) return { ok: false, error: "Tulis alasan laporan." };
  const sudah = db.select({ id: reports.id }).from(reports).where(and(eq(reports.reporterUserId, userId), eq(reports.targetType, input.targetType), eq(reports.targetId, input.targetId), eq(reports.status, "terbuka"))).get();
  if (sudah) return { ok: false, error: "Kamu sudah melaporkan ini." };
  db.insert(reports).values({ reporterUserId: userId, targetType: input.targetType, targetId: input.targetId, reason: input.alasan.trim().slice(0, 500) }).run();
  return { ok: true };
}

/** Blokir club (M-08): club yang diblokir tidak bisa menantang atau melihat match terbuka club ini. */
export function aturBlokir(adminId: string, targetClubId: string, blokir: boolean): Hasil {
  const club = clubMilik(adminId);
  if (!club || club.id === targetClubId) return { ok: false, error: "Tidak bisa memblokir." };
  if (blokir) db.insert(clubBlocks).values({ blockerClubId: club.id, blockedClubId: targetClubId }).onConflictDoNothing().run();
  else db.delete(clubBlocks).where(and(eq(clubBlocks.blockerClubId, club.id), eq(clubBlocks.blockedClubId, targetClubId))).run();
  return { ok: true };
}

export const diblokir = (clubId: string, targetClubId: string) =>
  !!db.select({ x: clubBlocks.blockerClubId }).from(clubBlocks).where(and(eq(clubBlocks.blockerClubId, clubId), eq(clubBlocks.blockedClubId, targetClubId))).get();
