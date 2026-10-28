import "server-only";
import { and, count, desc, eq, gt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { clubRatings, clubs, matches, moderationFlags, platformSettings, ratingHistory } from "@/db/schema";
import type { Format } from "@/db/enums";
import { HARI } from "@/lib/waktu";
import { hitungElo, levelDariRating, MIN_PERINGKAT_RESMI, PARAM_RATING, type ParamRating } from "./domain/reputasi";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Parameter Elo dari pengaturan platform (PRD 9.1 Konfigurasi), bawaan PRD 7.1. */
export function paramRating(tx: Tx | typeof db = db): ParamRating {
  const baris = tx.select().from(platformSettings).all();
  const ambil = (k: string, d: number) => {
    const v = Number(baris.find((b) => b.key === k)?.value);
    return Number.isFinite(v) && v > 0 ? v : d;
  };
  return {
    awal: ambil("rating.awal", PARAM_RATING.awal),
    kBaru: ambil("rating.k_baru", PARAM_RATING.kBaru),
    kLama: ambil("rating.k_lama", PARAM_RATING.kLama),
    batasBaru: ambil("rating.batas_baru", PARAM_RATING.batasBaru),
  };
}

function ratingClub(tx: Tx, clubId: string, format: Format, awal: number) {
  const r = tx.select().from(clubRatings).where(and(eq(clubRatings.clubId, clubId), eq(clubRatings.format, format))).get();
  if (r) return r;
  tx.insert(clubRatings).values({ clubId, format, rating: awal, confirmedMatches: 0 }).run();
  return { clubId, format, rating: awal, confirmedMatches: 0 };
}

/**
 * Terapkan hasil Selesai ke rating per format (PRD 7.1, H-03). Dipanggil sekali saat match menjadi Selesai,
 * di dalam transaksi yang sama. Match WO/dikecualikan tidak mengubah rating. Aman dipanggil ulang (idempoten).
 */
export function terapkanRating(tx: Tx, matchId: string, now = new Date()) {
  const m = tx.select().from(matches).where(eq(matches.id, matchId)).get();
  if (!m || m.status !== "selesai" || !m.opponentClubId || m.finalCreatorScore == null || m.finalOpponentScore == null) return;
  if (m.excludedFromRating) return;
  if (tx.select({ id: ratingHistory.id }).from(ratingHistory).where(eq(ratingHistory.matchId, matchId)).get()) return;

  // Anti-manipulasi (PRD 7.4): > 3 match antar pasangan yang sama dalam 30 hari → match berikutnya diabaikan dari rating.
  const pasangan = or(and(eq(matches.creatorClubId, m.creatorClubId), eq(matches.opponentClubId, m.opponentClubId)), and(eq(matches.creatorClubId, m.opponentClubId), eq(matches.opponentClubId, m.creatorClubId)));
  const [{ n }] = tx
    .select({ n: count() })
    .from(ratingHistory)
    .innerJoin(matches, eq(matches.id, ratingHistory.matchId))
    .where(and(eq(ratingHistory.clubId, m.creatorClubId), pasangan, gt(matches.scheduledAt, new Date((m.scheduledAt ?? now).getTime() - 30 * HARI))))
    .all();
  if (n >= 3) {
    tx.update(matches).set({ excludedFromRating: true }).where(eq(matches.id, matchId)).run();
    tx.insert(moderationFlags).values({ kind: "pasangan_sering", clubId: m.creatorClubId, otherClubId: m.opponentClubId, matchId, detail: `${n + 1} match dalam 30 hari; match ini diabaikan dari rating.`, createdAt: now }).run();
    return;
  }

  const p = paramRating(tx);
  const a = ratingClub(tx, m.creatorClubId, m.format, p.awal);
  const b = ratingClub(tx, m.opponentClubId, m.format, p.awal);
  const baru = hitungElo({ rating: a.rating, main: a.confirmedMatches }, { rating: b.rating, main: b.confirmedMatches }, m.finalCreatorScore, m.finalOpponentScore, p);

  for (const [lama, nilai] of [[a, baru.a], [b, baru.b]] as const) {
    tx.update(clubRatings)
      .set({ rating: nilai, confirmedMatches: sql`${clubRatings.confirmedMatches} + 1` })
      .where(and(eq(clubRatings.clubId, lama.clubId), eq(clubRatings.format, m.format)))
      .run();
    tx.insert(ratingHistory).values({ clubId: lama.clubId, format: m.format, matchId, ratingBefore: lama.rating, ratingAfter: nilai, delta: nilai - lama.rating, createdAt: now }).run();
    koreksiLevel(tx, lama.clubId);
    tandaiLonjakan(tx, lama.clubId, m.format, now);
  }
}

/** Kenaikan > 200 poin dalam 5 match → antrean tinjauan Admin platform (PRD 7.4). */
function tandaiLonjakan(tx: Tx, clubId: string, format: Format, now: Date) {
  const lima = tx.select({ delta: ratingHistory.delta }).from(ratingHistory).where(and(eq(ratingHistory.clubId, clubId), eq(ratingHistory.format, format))).orderBy(desc(ratingHistory.createdAt)).limit(5).all();
  const naik = lima.reduce((s, r) => s + r.delta, 0);
  if (naik <= 200) return;
  const ada = tx.select({ id: moderationFlags.id }).from(moderationFlags).where(and(eq(moderationFlags.clubId, clubId), eq(moderationFlags.kind, "lonjakan_rating"), eq(moderationFlags.status, "terbuka"))).get();
  if (!ada) tx.insert(moderationFlags).values({ kind: "lonjakan_rating", clubId, detail: `Naik ${naik} poin dalam 5 match terakhir (${format}).`, createdAt: now }).run();
}

/** Setelah 5 hasil, level club mengikuti rating format yang paling sering dimainkan (PRD C-05). */
function koreksiLevel(tx: Tx, clubId: string) {
  const r = tx.select().from(clubRatings).where(eq(clubRatings.clubId, clubId)).all();
  const total = r.reduce((n, x) => n + x.confirmedMatches, 0);
  if (total < MIN_PERINGKAT_RESMI) return;
  const utama = r.reduce((x, y) => (y.confirmedMatches > x.confirmedMatches ? y : x));
  tx.update(clubs).set({ level: levelDariRating(utama.rating) }).where(eq(clubs.id, clubId)).run();
}
