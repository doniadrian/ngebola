import "server-only";
import { and, asc, desc, eq, inArray, isNotNull, lte, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { clubPhotos, clubRatings, clubs, matches, players, reviews, squadMemberships, users } from "@/db/schema";
import type { Format } from "@/db/enums";
import { HARI } from "@/lib/waktu";
import { skorKeandalan, type CatatanJadwal } from "../domain/reputasi";

export type ClubPublik = typeof clubs.$inferSelect;

export const clubDariSlug = (slug: string) => db.select().from(clubs).where(eq(clubs.slug, slug)).get() ?? null;
export const clubDariId = (id: string) => db.select().from(clubs).where(eq(clubs.id, id)).get() ?? null;

/** Tampil di halaman publik hanya bila disetujui dan tidak ditangguhkan (PRD 1). */
export const tampilPublik = (c: ClubPublik | null): c is ClubPublik => !!c && c.registrationStatus === "disetujui" && !c.suspendedAt;

export const galeriClub = (clubId: string) => db.select().from(clubPhotos).where(eq(clubPhotos.clubId, clubId)).orderBy(asc(clubPhotos.sortOrder), asc(clubPhotos.id)).all();

const lawan = alias(clubs, "lawan");
const pembuat = alias(clubs, "pembuat");

/** Hasil Selesai club (terbaru dulu) dari sudut pandang club. */
export function riwayatHasil(clubId: string, batas = 10, lawanId?: string) {
  const baris = db
    .select({
      id: matches.id,
      format: matches.format,
      at: matches.scheduledAt,
      creatorClubId: matches.creatorClubId,
      skorPembuat: matches.finalCreatorScore,
      skorLawan: matches.finalOpponentScore,
      pembuat: { id: pembuat.id, name: pembuat.name, slug: pembuat.slug, logoPath: pembuat.logoPath, crestColor: pembuat.crestColor, initials: pembuat.initials },
      lawan: { id: lawan.id, name: lawan.name, slug: lawan.slug, logoPath: lawan.logoPath, crestColor: lawan.crestColor, initials: lawan.initials },
    })
    .from(matches)
    .innerJoin(pembuat, eq(pembuat.id, matches.creatorClubId))
    .innerJoin(lawan, eq(lawan.id, matches.opponentClubId))
    .where(
      and(
        eq(matches.status, "selesai"),
        isNotNull(matches.finalCreatorScore),
        or(eq(matches.creatorClubId, clubId), eq(matches.opponentClubId, clubId)),
        lawanId ? or(eq(matches.creatorClubId, lawanId), eq(matches.opponentClubId, lawanId)) : undefined,
      ),
    )
    .orderBy(desc(matches.scheduledAt))
    .limit(batas)
    .all();
  return baris.map((b) => {
    const kita = b.creatorClubId === clubId;
    const gol = kita ? b.skorPembuat! : b.skorLawan!;
    const kebobolan = kita ? b.skorLawan! : b.skorPembuat!;
    return {
      id: b.id,
      format: b.format,
      at: b.at!,
      musuh: kita ? b.lawan : b.pembuat,
      gol,
      kebobolan,
      hasil: gol > kebobolan ? ("M" as const) : gol === kebobolan ? ("S" as const) : ("K" as const),
    };
  });
}

export function headToHead(clubA: string, clubB: string) {
  const hasil = riwayatHasil(clubA, 1000, clubB);
  return {
    hasil: hasil.slice(0, 5),
    menang: hasil.filter((h) => h.hasil === "M").length,
    seri: hasil.filter((h) => h.hasil === "S").length,
    kalah: hasil.filter((h) => h.hasil === "K").length,
  };
}

/** Catatan match terjadwal untuk skor keandalan (PRD 7.2). */
function catatanJadwal(clubId: string, now: Date): CatatanJadwal[] {
  return db
    .select({ status: matches.status, at: matches.scheduledAt, late: matches.lateCancel, oleh: matches.cancelledByClubId, alasan: matches.cancelReason, wo: matches.woWinnerClubId })
    .from(matches)
    .where(
      and(
        or(eq(matches.creatorClubId, clubId), eq(matches.opponentClubId, clubId)),
        isNotNull(matches.scheduledAt),
        lte(matches.scheduledAt, new Date(now.getTime() + HARI)),
        // Batal jauh hari, karena cuaca dengan bukti, atau ditunda tidak dihitung (PRD 7.2); hanya batal mendadak.
        or(inArray(matches.status, ["selesai", "menunggu_hasil", "sengketa", "wo"]), and(eq(matches.status, "dibatalkan"), eq(matches.lateCancel, true))),
      ),
    )
    .all()
    .map((m) => ({
      waktu: m.at!,
      gagal:
        (m.status === "wo" && m.wo !== clubId) ||
        (m.status === "dibatalkan" && m.late && (m.oleh === clubId || m.alasan === "tidak_hadir")),
    }));
}

/** Rata-rata 10 penilaian terakhir yang sudah terbuka (keduanya mengisi atau lewat 7 hari) — PRD 7.3. */
function sportivitas(clubId: string, now: Date) {
  const baris = db
    .select({ s: reviews.sportsmanship, t: reviews.tidiness, matchId: reviews.matchId, at: reviews.createdAt, selesai: matches.endedAt })
    .from(reviews)
    .innerJoin(matches, eq(matches.id, reviews.matchId))
    .where(and(eq(reviews.reviewedClubId, clubId), eq(reviews.excluded, false)))
    .orderBy(desc(reviews.createdAt))
    .all();
  if (!baris.length) return null;
  const lengkap = new Set(
    db
      .select({ matchId: reviews.matchId })
      .from(reviews)
      .where(inArray(reviews.matchId, baris.map((b) => b.matchId)))
      .groupBy(reviews.matchId)
      .having(sql`count(*) >= 2`)
      .all()
      .map((r) => r.matchId),
  );
  const terbuka = baris.filter((b) => lengkap.has(b.matchId) || now.getTime() - (b.selesai ?? b.at).getTime() >= 7 * HARI).slice(0, 10);
  if (!terbuka.length) return null;
  const rata = (k: "s" | "t") => Math.round((10 * terbuka.reduce((n, b) => n + b[k], 0)) / terbuka.length) / 10;
  return { sportivitas: rata("s"), kerapian: rata("t"), jumlah: terbuka.length };
}

/** Statistik publik club (PRD C-03): dihitung otomatis dari hasil terkonfirmasi. */
export function statistikClub(clubId: string, now = new Date()) {
  const hasil = riwayatHasil(clubId, 100000);
  const rating = db.select().from(clubRatings).where(eq(clubRatings.clubId, clubId)).all();
  const per = (f: Format) => rating.find((r) => r.format === f) ?? null;
  return {
    main: hasil.length,
    menang: hasil.filter((h) => h.hasil === "M").length,
    seri: hasil.filter((h) => h.hasil === "S").length,
    kalah: hasil.filter((h) => h.hasil === "K").length,
    selisihGol: hasil.reduce((n, h) => n + h.gol - h.kebobolan, 0),
    limaTerakhir: hasil.slice(0, 5).map((h) => h.hasil),
    rating: { football: per("football"), mini: per("mini") },
    totalTerkonfirmasi: rating.reduce((n, r) => n + r.confirmedMatches, 0),
    keandalan: skorKeandalan(catatanJadwal(clubId, now)),
    sportivitas: sportivitas(clubId, now),
  };
}
export type StatistikClub = ReturnType<typeof statistikClub>;

// ── Skuad ───────────────────────────────────────────────────────────────────

export function anggotaSkuad(clubId: string, status: "aktif" | "diajukan" = "aktif") {
  return db
    .select({
      membershipId: squadMemberships.id,
      userId: users.id,
      name: users.name,
      via: squadMemberships.via,
      sejak: status === "aktif" ? squadMemberships.decidedAt : squadMemberships.createdAt,
      position: players.position,
      dominantFoot: players.dominantFoot,
      area: players.area,
      photoPath: players.photoPath,
      avatarSeed: players.avatarSeed,
    })
    .from(squadMemberships)
    .innerJoin(users, eq(users.id, squadMemberships.playerUserId))
    .innerJoin(players, eq(players.userId, users.id))
    .where(and(eq(squadMemberships.clubId, clubId), eq(squadMemberships.status, status)))
    .orderBy(asc(users.name))
    .all();
}

export const jumlahAnggota = (clubId: string) =>
  db.select({ n: sql<number>`count(*)` }).from(squadMemberships).where(and(eq(squadMemberships.clubId, clubId), eq(squadMemberships.status, "aktif"))).get()?.n ?? 0;

/** Permintaan gabung pemain yang masih menunggu (untuk halaman skuad pemain). */
export const permintaanPemain = (playerUserId: string) =>
  db
    .select({ id: squadMemberships.id, clubName: clubs.name, clubId: clubs.id })
    .from(squadMemberships)
    .innerJoin(clubs, eq(clubs.id, squadMemberships.clubId))
    .where(and(eq(squadMemberships.playerUserId, playerUserId), eq(squadMemberships.status, "diajukan")))
    .get() ?? null;

// ── Platform ────────────────────────────────────────────────────────────────

export function antreanVerifikasi() {
  return db
    .select({ club: clubs, adminName: users.name, adminEmail: users.email })
    .from(clubs)
    .innerJoin(users, eq(users.id, clubs.adminUserId))
    .where(eq(clubs.registrationStatus, "diajukan"))
    .orderBy(asc(clubs.updatedAt))
    .all();
}

/** Daftar club lain yang bisa ditantang (disetujui, tidak ditangguhkan). */
export function clubLain(kecualiId: string, cari?: string) {
  return db
    .select()
    .from(clubs)
    .where(
      and(
        ne(clubs.id, kecualiId),
        eq(clubs.registrationStatus, "disetujui"),
        sql`${clubs.suspendedAt} is null`,
        cari ? or(sql`lower(${clubs.name}) like ${`%${cari.toLowerCase()}%`}`, sql`lower(${clubs.area}) like ${`%${cari.toLowerCase()}%`}`) : undefined,
      ),
    )
    .orderBy(asc(clubs.name))
    .all();
}

