import "server-only";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { clubs, matches, rsvps, squadInvites, squadMemberships, users } from "@/db/schema";
import { HARI } from "@/lib/waktu";
import { randomCode, randomToken, sha256 } from "./auth/crypto";
import { clubMilik } from "./club";
import { hitungUlangKesiapan } from "./kesiapan";
import { pesanSistem } from "./match";
import { beritahu } from "./notify";

export const UNDANGAN_BERLAKU_MS = 7 * HARI;
type Hasil<T = object> = ({ ok: true } & T) | { ok: false; error: string };
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const bisaMenerimaAnggota = (c: { registrationStatus: string; suspendedAt: Date | null }) => c.registrationStatus !== "ditolak" && !c.suspendedAt;

// ── Undangan (Admin club) ────────────────────────────────────────────────────

export function buatUndangan(adminUserId: string, now = new Date()): Hasil<{ token: string; expiresAt: Date }> {
  const c = clubMilik(adminUserId);
  if (!c || !bisaMenerimaAnggota(c)) return { ok: false, error: "Club belum bisa menerima anggota." };
  const token = randomToken();
  const expiresAt = new Date(now.getTime() + UNDANGAN_BERLAKU_MS);
  db.insert(squadInvites).values({ clubId: c.id, tokenHash: sha256(token), createdBy: adminUserId, expiresAt, createdAt: now }).run();
  return { ok: true, token, expiresAt };
}

/** Cabut semua tautan undangan aktif club. */
export function cabutUndangan(adminUserId: string): Hasil {
  const c = clubMilik(adminUserId);
  if (!c) return { ok: false, error: "Club tidak ditemukan." };
  db.update(squadInvites).set({ revokedAt: new Date() }).where(and(eq(squadInvites.clubId, c.id), isNull(squadInvites.revokedAt))).run();
  return { ok: true };
}

export function gantiKodeSkuad(adminUserId: string): Hasil<{ kode: string }> {
  const c = clubMilik(adminUserId);
  if (!c) return { ok: false, error: "Club tidak ditemukan." };
  let kode = randomCode();
  while (db.select({ id: clubs.id }).from(clubs).where(eq(clubs.squadCode, kode)).get()) kode = randomCode();
  db.update(clubs).set({ squadCode: kode, updatedAt: new Date() }).where(eq(clubs.id, c.id)).run();
  return { ok: true, kode };
}

export function clubDariUndangan(token: string, now = new Date()) {
  return (
    db
      .select({ id: clubs.id, name: clubs.name, slug: clubs.slug, logoPath: clubs.logoPath, crestColor: clubs.crestColor, initials: clubs.initials, area: clubs.area, registrationStatus: clubs.registrationStatus, suspendedAt: clubs.suspendedAt })
      .from(squadInvites)
      .innerJoin(clubs, eq(clubs.id, squadInvites.clubId))
      .where(and(eq(squadInvites.tokenHash, sha256(token)), isNull(squadInvites.revokedAt), gt(squadInvites.expiresAt, now)))
      .get() ?? null
  );
}

// ── Pemain ──────────────────────────────────────────────────────────────────

/** Pemain meminta bergabung lewat kode skuad atau tautan undangan; Admin club menyetujui (P-02). */
export async function mintaGabung(playerUserId: string, cara: { kode: string } | { token: string }): Promise<Hasil<{ clubName: string }>> {
  const c =
    "kode" in cara
      ? db.select().from(clubs).where(eq(clubs.squadCode, cara.kode.trim().toUpperCase())).get()
      : (() => {
          const u = clubDariUndangan(cara.token);
          return u ? db.select().from(clubs).where(eq(clubs.id, u.id)).get() : undefined;
        })();
  if (!c) return { ok: false, error: "kode" in cara ? "Kode skuad tidak ditemukan. Cek lagi ke admin club." : "Tautan undangan tidak berlaku lagi." };
  if (!bisaMenerimaAnggota(c)) return { ok: false, error: "Club ini sedang tidak menerima anggota." };

  const milik = db
    .select({ clubId: squadMemberships.clubId, status: squadMemberships.status })
    .from(squadMemberships)
    .where(and(eq(squadMemberships.playerUserId, playerUserId), inArray(squadMemberships.status, ["aktif", "diajukan"])))
    .all();
  if (milik.some((m) => m.status === "aktif")) return { ok: false, error: "Kamu sudah anggota aktif sebuah club. Keluar dulu sebelum gabung club lain." };
  if (milik.some((m) => m.clubId === c.id)) return { ok: false, error: "Permintaanmu ke club ini masih menunggu persetujuan." };
  if (milik.length > 0) return { ok: false, error: "Batalkan dulu permintaan gabung yang masih menunggu." };

  db.insert(squadMemberships).values({ playerUserId, clubId: c.id, status: "diajukan", via: "kode" in cara ? "kode" : "tautan" }).run();
  const nama = db.select({ name: users.name }).from(users).where(eq(users.id, playerUserId)).get()?.name ?? "Pemain";
  await beritahu([c.adminUserId], { trigger: "permintaan_skuad", title: `${nama} minta gabung skuad`, url: "/club/skuad" });
  return { ok: true, clubName: c.name };
}

export function batalkanPermintaan(playerUserId: string): Hasil {
  const r = db
    .update(squadMemberships)
    .set({ status: "keluar", endedAt: new Date(), endedBy: "pemain" })
    .where(and(eq(squadMemberships.playerUserId, playerUserId), eq(squadMemberships.status, "diajukan")))
    .run();
  return r.changes > 0 ? { ok: true } : { ok: false, error: "Tidak ada permintaan yang menunggu." };
}

/**
 * RSVP untuk match yang belum dimainkan dihapus saat pemain keluar/dikeluarkan, lalu jumlah siap dihitung ulang
 * (tanda siap dicabut bila kurang dari batas). PRD 11.2.
 */
function hapusRsvpMendatang(tx: Tx, playerUserId: string, clubId: string, now: Date) {
  const mendatang = tx
    .select({ id: matches.id, format: matches.format })
    .from(rsvps)
    .innerJoin(matches, eq(matches.id, rsvps.matchId))
    .where(and(eq(rsvps.playerUserId, playerUserId), eq(rsvps.clubId, clubId), inArray(matches.status, ["terkonfirmasi", "ditunda"]), gt(matches.scheduledAt, now)))
    .all();
  if (!mendatang.length) return;
  tx.delete(rsvps).where(and(eq(rsvps.playerUserId, playerUserId), inArray(rsvps.matchId, mendatang.map((m) => m.id)))).run();
  for (const m of mendatang) {
    if (hitungUlangKesiapan(tx, m.id, clubId, m.format, now)) pesanSistem(tx, m.id, "Jumlah pemain siap turun di bawah batas karena ada pemain keluar skuad. Tanda siap dicabut otomatis.", now);
  }
}

export async function keluarSkuad(playerUserId: string, now = new Date()): Promise<Hasil> {
  const m = db.select().from(squadMemberships).where(and(eq(squadMemberships.playerUserId, playerUserId), eq(squadMemberships.status, "aktif"))).get();
  if (!m) return { ok: false, error: "Kamu belum anggota club mana pun." };
  db.transaction((tx) => {
    tx.update(squadMemberships).set({ status: "keluar", endedAt: now, endedBy: "pemain" }).where(eq(squadMemberships.id, m.id)).run();
    hapusRsvpMendatang(tx, playerUserId, m.clubId, now);
  });
  const c = db.select({ adminUserId: clubs.adminUserId }).from(clubs).where(eq(clubs.id, m.clubId)).get();
  const nama = db.select({ name: users.name }).from(users).where(eq(users.id, playerUserId)).get()?.name ?? "Pemain";
  if (c) await beritahu([c.adminUserId], { trigger: "keluar_skuad", title: `${nama} keluar dari skuad`, url: "/club/skuad" });
  return { ok: true };
}

// ── Admin club ──────────────────────────────────────────────────────────────

function keanggotaanClubSendiri(adminUserId: string, membershipId: string) {
  const c = clubMilik(adminUserId);
  if (!c) return null;
  const m = db.select().from(squadMemberships).where(and(eq(squadMemberships.id, membershipId), eq(squadMemberships.clubId, c.id))).get();
  return m ? { c, m } : null;
}

export async function putuskanPermintaan(adminUserId: string, membershipId: string, setuju: boolean, now = new Date()): Promise<Hasil> {
  const x = keanggotaanClubSendiri(adminUserId, membershipId);
  if (!x || x.m.status !== "diajukan") return { ok: false, error: "Permintaan tidak ditemukan atau sudah diputuskan." };
  if (setuju) {
    const aktif = db.select({ id: squadMemberships.id }).from(squadMemberships).where(and(eq(squadMemberships.playerUserId, x.m.playerUserId), eq(squadMemberships.status, "aktif"))).get();
    if (aktif) return { ok: false, error: "Pemain ini sudah aktif di club lain." };
  }
  db.update(squadMemberships)
    .set({ status: setuju ? "aktif" : "ditolak", decidedBy: adminUserId, decidedAt: now })
    .where(eq(squadMemberships.id, membershipId))
    .run();
  await beritahu([x.m.playerUserId], {
    trigger: "keputusan_skuad",
    title: setuju ? `Kamu resmi gabung ${x.c.name}` : `Permintaan gabung ${x.c.name} ditolak`,
    url: "/pemain/skuad",
  });
  return { ok: true };
}

export async function keluarkanAnggota(adminUserId: string, membershipId: string, now = new Date()): Promise<Hasil> {
  const x = keanggotaanClubSendiri(adminUserId, membershipId);
  if (!x || x.m.status !== "aktif") return { ok: false, error: "Anggota tidak ditemukan." };
  db.transaction((tx) => {
    tx.update(squadMemberships).set({ status: "keluar", endedAt: now, endedBy: "admin" }).where(eq(squadMemberships.id, membershipId)).run();
    hapusRsvpMendatang(tx, x.m.playerUserId, x.c.id, now);
  });
  await beritahu([x.m.playerUserId], { trigger: "dikeluarkan_skuad", title: `Kamu dikeluarkan dari skuad ${x.c.name}`, url: "/pemain/skuad" });
  return { ok: true };
}
