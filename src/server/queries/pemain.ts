import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { rsvps } from "@/db/schema";
import { matchClub } from "./match";

/** Jadwal & hasil club sendiri untuk Pemain (P-05), plus jawaban RSVP-nya. */
export function jadwalPemain(userId: string, clubId: string) {
  const semua = matchClub(clubId);
  const jawaban = new Map(
    semua.length
      ? db
          .select({ matchId: rsvps.matchId, answer: rsvps.answer })
          .from(rsvps)
          .where(and(eq(rsvps.playerUserId, userId), inArray(rsvps.matchId, semua.map((m) => m.match.id))))
          .all()
          .map((r) => [r.matchId, r.answer])
      : [],
  );
  const mendatang = semua
    .filter((m) => ["terkonfirmasi", "ditunda", "berlangsung"].includes(m.match.status))
    .sort((a, b) => (a.match.scheduledAt?.getTime() ?? 0) - (b.match.scheduledAt?.getTime() ?? 0));
  const hasil = semua
    .filter((m) => ["selesai", "wo", "menunggu_hasil", "sengketa"].includes(m.match.status))
    .sort((a, b) => (b.match.scheduledAt?.getTime() ?? 0) - (a.match.scheduledAt?.getTime() ?? 0));
  // Riwayat match yang diikuti (P-07): hasil dengan RSVP Ikut.
  const diikuti = hasil.filter((m) => m.match.status === "selesai" && jawaban.get(m.match.id) === "ikut");
  return { mendatang, hasil, diikuti, jawaban };
}
