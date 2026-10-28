import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clubs, players, squadMemberships } from "@/db/schema";
import { LABEL_PERAN } from "@/db/enums";
import type { SessionUser } from "@/server/auth/service";
import { jumlahBelumDibaca } from "./notifikasi";

export type ClubRingkas = {
  id: string;
  slug: string;
  name: string;
  logoPath: string | null;
  crestColor: string;
  initials: string;
  jerseyHome: string;
  registrationStatus: "diajukan" | "disetujui" | "ditolak";
  suspendedAt: Date | null;
};

const kolomClub = {
  id: clubs.id,
  slug: clubs.slug,
  name: clubs.name,
  logoPath: clubs.logoPath,
  crestColor: clubs.crestColor,
  initials: clubs.initials,
  jerseyHome: clubs.jerseyHome,
  registrationStatus: clubs.registrationStatus,
  suspendedAt: clubs.suspendedAt,
};

export const clubMilikAdmin = (userId: string): ClubRingkas | null =>
  db.select(kolomClub).from(clubs).where(eq(clubs.adminUserId, userId)).get() ?? null;

export const clubAktifPemain = (userId: string): ClubRingkas | null =>
  db
    .select(kolomClub)
    .from(squadMemberships)
    .innerJoin(clubs, eq(clubs.id, squadMemberships.clubId))
    .where(and(eq(squadMemberships.playerUserId, userId), eq(squadMemberships.status, "aktif")))
    .get() ?? null;

export type Identitas = {
  namaDepan: string;
  nama: string;
  peranLabel: string;
  club: ClubRingkas | null;
  avatarSeed: string | null;
  belumDibaca: number;
};

/** Data kecil untuk header & sidebar. */
export function identitas(user: SessionUser): Identitas {
  const namaDepan = user.name.split(/\s+/)[0];
  const club = user.role === "club_admin" ? clubMilikAdmin(user.id) : user.role === "player" ? clubAktifPemain(user.id) : null;
  const avatarSeed = user.role === "player" ? (db.select({ s: players.avatarSeed }).from(players).where(eq(players.userId, user.id)).get()?.s ?? user.id) : user.id;
  return { namaDepan, nama: user.name, peranLabel: LABEL_PERAN[user.role], club, avatarSeed, belumDibaca: jumlahBelumDibaca(user.id) };
}
