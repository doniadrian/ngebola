import "server-only";
import { and, asc, desc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { clubBlocks, clubRatings, clubs, matches, ratingHistory, scheduleProposals, venues } from "@/db/schema";
import type { Area, Format, Level } from "@/db/enums";
import { susunPeringkat } from "../domain/reputasi";

export type FilterTerbuka = { cari?: string; area?: Area; format?: Format; level?: Level };

/**
 * Match terbuka yang sedang mencari lawan (PRD 1): club terverifikasi, status Terbuka, belum punya lawan,
 * masih punya opsi jadwal di masa depan. Alamat lapangan manual tidak dipublikasikan.
 * `viewerClubId`: match club sendiri disembunyikan, club yang saling blokir tidak tampil (M-02, M-08).
 */
export function matchTerbuka(filter: FilterTerbuka = {}, opsi: { viewerClubId?: string; viewerArea?: string; now?: Date } = {}) {
  const now = opsi.now ?? new Date();
  const cari = filter.cari?.trim().toLowerCase();
  const baris = db
    .select({ match: matches, club: clubs })
    .from(matches)
    .innerJoin(clubs, eq(clubs.id, matches.creatorClubId))
    .where(
      and(
        eq(matches.status, "terbuka"),
        eq(matches.type, "terbuka"),
        isNull(matches.opponentClubId),
        eq(clubs.registrationStatus, "disetujui"),
        isNull(clubs.suspendedAt),
        filter.area ? eq(matches.area, filter.area) : undefined,
        filter.format ? eq(matches.format, filter.format) : undefined,
        filter.level ? eq(matches.level, filter.level) : undefined,
        cari ? or(sql`lower(${clubs.name}) like ${`%${cari}%`}`, sql`lower(${matches.area}) like ${`%${cari}%`}`) : undefined,
        opsi.viewerClubId ? sql`${matches.creatorClubId} <> ${opsi.viewerClubId}` : undefined,
      ),
    )
    .all();
  if (!baris.length) return [];

  const ids = baris.map((b) => b.match.id);
  const opsiJadwal = db
    .select({ matchId: scheduleProposals.matchId, startsAt: scheduleProposals.startsAt, venueId: scheduleProposals.venueId, venueName: venues.name, venueVerified: venues.verified })
    .from(scheduleProposals)
    .leftJoin(venues, eq(venues.id, scheduleProposals.venueId))
    .where(and(inArray(scheduleProposals.matchId, ids), eq(scheduleProposals.status, "menunggu"), gt(scheduleProposals.startsAt, now)))
    .orderBy(asc(scheduleProposals.startsAt))
    .all();

  const blokir = new Set<string>();
  if (opsi.viewerClubId) {
    for (const b of db.select().from(clubBlocks).where(or(eq(clubBlocks.blockerClubId, opsi.viewerClubId), eq(clubBlocks.blockedClubId, opsi.viewerClubId))).all()) {
      blokir.add(b.blockerClubId === opsi.viewerClubId ? b.blockedClubId : b.blockerClubId);
    }
  }

  return baris
    .map(({ match, club }) => ({ match, club, opsi: opsiJadwal.filter((o) => o.matchId === match.id) }))
    .filter((m) => m.opsi.length > 0 && !blokir.has(m.club.id))
    .sort((a, b) => Number(b.match.area === opsi.viewerArea) - Number(a.match.area === opsi.viewerArea) || a.opsi[0].startsAt.getTime() - b.opsi[0].startsAt.getTime());
}
export type MatchTerbuka = ReturnType<typeof matchTerbuka>[number];

/** Leaderboard per format (PRD 1): dari hasil Selesai; club ditolak/ditangguhkan tidak tampil. */
export function leaderboard(format: Format, cari?: string) {
  const baris = db
    .select({ clubId: clubs.id, rating: clubRatings.rating, main: clubRatings.confirmedMatches, club: clubs })
    .from(clubRatings)
    .innerJoin(clubs, eq(clubs.id, clubRatings.clubId))
    .where(and(eq(clubRatings.format, format), eq(clubs.registrationStatus, "disetujui"), isNull(clubs.suspendedAt)))
    .all();
  // Menang/seri/kalah dari hasil yang sama dengan yang dihitung ke rating (WO & hasil yang diabaikan tidak termasuk).
  const hasil = db
    .select({ clubId: ratingHistory.clubId, pembuat: matches.creatorClubId, a: matches.finalCreatorScore, b: matches.finalOpponentScore })
    .from(ratingHistory)
    .innerJoin(matches, eq(matches.id, ratingHistory.matchId))
    .where(eq(ratingHistory.format, format))
    .all();
  const rekap = new Map<string, { menang: number; seri: number; kalah: number }>();
  for (const h of hasil) {
    if (h.a == null || h.b == null) continue;
    const gol = h.clubId === h.pembuat ? h.a : h.b;
    const lawan = h.clubId === h.pembuat ? h.b : h.a;
    const r = rekap.get(h.clubId) ?? { menang: 0, seri: 0, kalah: 0 };
    if (gol > lawan) r.menang++;
    else if (gol === lawan) r.seri++;
    else r.kalah++;
    rekap.set(h.clubId, r);
  }
  const susun = susunPeringkat(baris.map((b) => ({ ...b, ...(rekap.get(b.clubId) ?? { menang: 0, seri: 0, kalah: 0 }) })));
  // Filter tidak menghitung ulang nomor peringkat.
  const q = cari?.trim().toLowerCase();
  const cocok = (b: (typeof baris)[number]) => !q || b.club.name.toLowerCase().includes(q) || b.club.area.toLowerCase().includes(q);
  return { resmi: susun.resmi.filter(cocok), sementara: susun.sementara.filter(cocok) };
}

/** Angka nyata untuk strip beranda: club terverifikasi aktif, match selesai, lapangan terdaftar, kecamatan tercakup. */
export function statistikBeranda() {
  const aktif = and(eq(clubs.registrationStatus, "disetujui"), isNull(clubs.suspendedAt));
  const club = db.select({ n: sql<number>`count(*)` }).from(clubs).where(aktif).get()?.n ?? 0;
  const matchSelesai = db.select({ n: sql<number>`count(*)` }).from(matches).where(eq(matches.status, "selesai")).get()?.n ?? 0;
  const lapangan = db.select({ n: sql<number>`count(*)` }).from(venues).get()?.n ?? 0;
  const area = db.select({ a: clubs.area }).from(clubs).where(aktif).groupBy(clubs.area).all().filter((r) => r.a).length;
  return { club, matchSelesai, lapangan, area };
}

/** Hasil resmi terbaru (dikonfirmasi kedua club / diputus admin) untuk ilustrasi beranda. Club ditangguhkan tidak tampil. */
export function hasilTerbaru() {
  const lawan = alias(clubs, "lawan");
  const r = db
    .select({ match: matches, pembuat: clubs, lawan })
    .from(matches)
    .innerJoin(clubs, eq(clubs.id, matches.creatorClubId))
    .innerJoin(lawan, eq(lawan.id, matches.opponentClubId))
    .where(and(eq(matches.status, "selesai"), eq(matches.excludedFromRating, false), isNull(clubs.suspendedAt), isNull(lawan.suspendedAt)))
    .orderBy(desc(matches.updatedAt))
    .limit(1)
    .get();
  if (!r || r.match.finalCreatorScore == null || r.match.finalOpponentScore == null) return null;
  return { format: r.match.format, pembuat: r.pembuat, lawan: r.lawan, skor: [r.match.finalCreatorScore, r.match.finalOpponentScore] as const };
}
export type HasilTerbaru = NonNullable<ReturnType<typeof hasilTerbaru>>;
