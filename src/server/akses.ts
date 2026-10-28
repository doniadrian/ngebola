import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { clubs, squadMemberships } from "@/db/schema";
import type { SessionUser } from "./auth/service";

const clubAktif = (playerUserId: string) =>
  db
    .select({ clubId: squadMemberships.clubId, adminUserId: clubs.adminUserId })
    .from(squadMemberships)
    .innerJoin(clubs, eq(clubs.id, squadMemberships.clubId))
    .where(and(eq(squadMemberships.playerUserId, playerUserId), eq(squadMemberships.status, "aktif")))
    .get();

/**
 * Profil pemain hanya untuk: pemain itu sendiri, Admin platform, Admin club tempat ia aktif/mengajukan,
 * dan sesama anggota skuad aktif (PRD 4.4). Tidak pernah publik.
 */
export function bolehLihatPemain(viewer: SessionUser | null, playerUserId: string): boolean {
  if (!viewer) return false;
  if (viewer.id === playerUserId || viewer.role === "platform_admin") return true;
  if (viewer.role === "club_admin") {
    return !!db
      .select({ id: squadMemberships.id })
      .from(squadMemberships)
      .innerJoin(clubs, eq(clubs.id, squadMemberships.clubId))
      .where(and(eq(squadMemberships.playerUserId, playerUserId), eq(clubs.adminUserId, viewer.id), inArray(squadMemberships.status, ["aktif", "diajukan"])))
      .get();
  }
  const milik = clubAktif(playerUserId);
  const viewerClub = clubAktif(viewer.id);
  return !!milik && !!viewerClub && milik.clubId === viewerClub.clubId;
}
