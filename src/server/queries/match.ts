import "server-only";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { clubs, matchChangeRequests, matches, matchReadiness, players, rsvps, scheduleProposals, squadMemberships, users, venues } from "@/db/schema";
import type { StatusMatch } from "@/db/enums";
import { pihakMenunggu, usulanTerbaru } from "../match";

const pembuat = alias(clubs, "pembuat");
const lawan = alias(clubs, "lawan");

const kolomRingkas = {
  match: matches,
  pembuat: { id: pembuat.id, name: pembuat.name, slug: pembuat.slug, logoPath: pembuat.logoPath, crestColor: pembuat.crestColor, initials: pembuat.initials, area: pembuat.area, jerseyHome: pembuat.jerseyHome },
  lawan: { id: lawan.id, name: lawan.name, slug: lawan.slug, logoPath: lawan.logoPath, crestColor: lawan.crestColor, initials: lawan.initials, area: lawan.area, jerseyHome: lawan.jerseyHome },
  venue: { id: venues.id, name: venues.name, address: venues.address, lat: venues.lat, lng: venues.lng, verified: venues.verified },
};

export function detailMatch(id: string) {
  const r = db
    .select(kolomRingkas)
    .from(matches)
    .innerJoin(pembuat, eq(pembuat.id, matches.creatorClubId))
    .leftJoin(lawan, eq(lawan.id, matches.opponentClubId))
    .leftJoin(venues, eq(venues.id, matches.venueId))
    .where(eq(matches.id, id))
    .get();
  if (!r) return null;
  const usulan = db
    .select({ p: scheduleProposals, venueName: venues.name, venueVerified: venues.verified })
    .from(scheduleProposals)
    .leftJoin(venues, eq(venues.id, scheduleProposals.venueId))
    .where(eq(scheduleProposals.matchId, id))
    .orderBy(desc(scheduleProposals.round), asc(scheduleProposals.startsAt))
    .all();
  const putaran = usulan[0]?.p.round ?? 0;
  return {
    ...r,
    lawan: r.lawan?.id ? r.lawan : null,
    venue: r.venue?.id ? r.venue : null,
    usulan: usulan.filter((u) => u.p.round === putaran),
    menunggu: pihakMenunggu(r.match, usulanTerbaru(db, id)),
    perubahan: db.select().from(matchChangeRequests).where(eq(matchChangeRequests.matchId, id)).orderBy(desc(matchChangeRequests.createdAt)).all(),
    kesiapan: db.select().from(matchReadiness).where(eq(matchReadiness.matchId, id)).all(),
  };
}
export type DetailMatch = NonNullable<ReturnType<typeof detailMatch>>;

/** Semua match club (untuk tab Jadwal), terbaru dulu. */
export function matchClub(clubId: string, status?: StatusMatch[]) {
  return db
    .select(kolomRingkas)
    .from(matches)
    .innerJoin(pembuat, eq(pembuat.id, matches.creatorClubId))
    .leftJoin(lawan, eq(lawan.id, matches.opponentClubId))
    .leftJoin(venues, eq(venues.id, matches.venueId))
    .where(and(or(eq(matches.creatorClubId, clubId), eq(matches.opponentClubId, clubId)), status ? inArray(matches.status, status) : undefined))
    .orderBy(desc(matches.updatedAt))
    .all()
    .map((r) => ({ ...r, lawan: r.lawan?.id ? r.lawan : null, venue: r.venue?.id ? r.venue : null }));
}
export type BarisMatch = ReturnType<typeof matchClub>[number];

/** Opsi jadwal pertama per match (untuk tampilan daftar sebelum terkonfirmasi). */
export function opsiPertama(matchIds: string[]) {
  if (!matchIds.length) return new Map<string, Date>();
  const baris = db
    .select({ matchId: scheduleProposals.matchId, startsAt: scheduleProposals.startsAt, round: scheduleProposals.round })
    .from(scheduleProposals)
    .where(and(inArray(scheduleProposals.matchId, matchIds), eq(scheduleProposals.status, "menunggu")))
    .orderBy(asc(scheduleProposals.startsAt))
    .all();
  const peta = new Map<string, Date>();
  for (const b of baris) if (!peta.has(b.matchId)) peta.set(b.matchId, b.startsAt);
  return peta;
}

/** RSVP anggota aktif club untuk satu match (dilihat Admin club). */
export function rsvpSkuad(matchId: string, clubId: string) {
  const anggota = db
    .select({ userId: users.id, name: users.name, avatarSeed: players.avatarSeed, photoPath: players.photoPath, position: players.position })
    .from(squadMemberships)
    .innerJoin(users, eq(users.id, squadMemberships.playerUserId))
    .innerJoin(players, eq(players.userId, users.id))
    .where(and(eq(squadMemberships.clubId, clubId), eq(squadMemberships.status, "aktif")))
    .orderBy(asc(users.name))
    .all();
  const jawab = new Map(db.select().from(rsvps).where(and(eq(rsvps.matchId, matchId), eq(rsvps.clubId, clubId))).all().map((r) => [r.playerUserId, r]));
  return anggota.map((a) => ({ ...a, jawaban: jawab.get(a.userId)?.answer ?? null, diubah: jawab.get(a.userId)?.updatedAt ?? null }));
}

export const jawabanRsvp = (matchId: string, playerUserId: string) =>
  db.select({ answer: rsvps.answer }).from(rsvps).where(and(eq(rsvps.matchId, matchId), eq(rsvps.playerUserId, playerUserId))).get()?.answer ?? null;
