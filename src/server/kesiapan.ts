import "server-only";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { clubs, matches, matchReadiness, rsvps, squadMemberships } from "@/db/schema";
import { MIN_PEMAIN, type Format } from "@/db/enums";
import { JAM } from "@/lib/waktu";
import { clubMilik } from "./club";
import { lawanDari, peserta, pesanSistem } from "./match";
import { beritahu } from "./notify";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Hasil<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export const KUNCI_MS = 2 * JAM;

/** RSVP & jumlah pemain siap terkunci 2 jam sebelum kick-off (P-03, R-01). */
export const terkunci = (m: { scheduledAt: Date | null }, now = new Date()) => !!m.scheduledAt && m.scheduledAt.getTime() - now.getTime() <= KUNCI_MS;

const jumlahAnggota = (tx: Tx | typeof db, clubId: string) =>
  tx.select({ n: count() }).from(squadMemberships).where(and(eq(squadMemberships.clubId, clubId), eq(squadMemberships.status, "aktif"))).get()?.n ?? 0;

/**
 * Hitung ulang jumlah siap dari RSVP Ikut (bila club punya skuad dan tidak diisi manual).
 * Bila jumlah turun di bawah batas saat club sudah siap, tanda siap dicabut (PRD 11.2). Mengembalikan true bila dicabut.
 */
export function hitungUlangKesiapan(tx: Tx, matchId: string, clubId: string, format: Format, now: Date): boolean {
  tx.insert(matchReadiness).values({ matchId, clubId, updatedAt: now }).onConflictDoNothing().run();
  const r = tx.select().from(matchReadiness).where(and(eq(matchReadiness.matchId, matchId), eq(matchReadiness.clubId, clubId))).get()!;
  let jumlah = r.playersReady;
  if (!r.manualOverride && jumlahAnggota(tx, clubId) > 0) {
    jumlah = tx.select({ n: count() }).from(rsvps).where(and(eq(rsvps.matchId, matchId), eq(rsvps.clubId, clubId), eq(rsvps.answer, "ikut"))).get()?.n ?? 0;
  }
  const dicabut = r.isReady && jumlah < MIN_PEMAIN[format];
  tx.update(matchReadiness)
    .set({ playersReady: jumlah, isReady: dicabut ? false : r.isReady, updatedAt: now })
    .where(and(eq(matchReadiness.matchId, matchId), eq(matchReadiness.clubId, clubId)))
    .run();
  return dicabut;
}

async function kabariPencabutan(m: typeof matches.$inferSelect, clubId: string, now: Date) {
  const nama = db.select({ name: clubs.name }).from(clubs).where(eq(clubs.id, clubId)).get()?.name ?? "Club";
  pesanSistem(db, m.id, `Jumlah pemain siap ${nama} turun di bawah batas ${MIN_PEMAIN[m.format]}. Tanda siap dicabut otomatis.`, now);
  const lawan = lawanDari(m, clubId);
  const adminLawan = lawan && db.select({ id: clubs.adminUserId }).from(clubs).where(eq(clubs.id, lawan)).get()?.id;
  const adminSendiri = db.select({ id: clubs.adminUserId }).from(clubs).where(eq(clubs.id, clubId)).get()?.id;
  await beritahu([adminLawan, adminSendiri].filter(Boolean) as string[], { trigger: "kesiapan_dicabut", title: `${nama} belum siap: pemain kurang`, url: `/club/match/${m.id}` });
}

/** Pemain mengonfirmasi Ikut / Tidak / Ragu untuk match terkonfirmasi club-nya (P-03). */
export async function simpanRsvp(playerUserId: string, matchId: string, jawaban: "ikut" | "tidak" | "ragu", now = new Date()): Promise<Hasil> {
  const m = db.select().from(matches).where(eq(matches.id, matchId)).get();
  const anggota = db.select({ clubId: squadMemberships.clubId }).from(squadMemberships).where(and(eq(squadMemberships.playerUserId, playerUserId), eq(squadMemberships.status, "aktif"))).get();
  if (!m || !anggota || !peserta(m, anggota.clubId)) return { ok: false, error: "Match ini bukan match club-mu." };
  if (m.status !== "terkonfirmasi") return { ok: false, error: "Konfirmasi ikut hanya untuk match yang sudah terkonfirmasi." };
  if (terkunci(m, now)) return { ok: false, error: "Konfirmasi ditutup 2 jam sebelum kick-off. Hubungi admin club." };

  const dicabut = db.transaction((tx) => {
    tx.insert(rsvps)
      .values({ matchId, playerUserId, clubId: anggota.clubId, answer: jawaban, updatedAt: now })
      .onConflictDoUpdate({ target: [rsvps.matchId, rsvps.playerUserId], set: { answer: jawaban, clubId: anggota.clubId, updatedAt: now } })
      .run();
    return hitungUlangKesiapan(tx, matchId, anggota.clubId, m.format, now);
  });
  if (dicabut) await kabariPencabutan(m, anggota.clubId, now);
  return { ok: true };
}

/**
 * Admin club mengatur kesiapan (R-01..R-03): `jumlah` angka = isi manual, null = ikuti RSVP; `siap` menandai siap/belum.
 * Tombol siap ditolak di bawah batas minimal pemain.
 */
export async function aturKesiapan(adminId: string, matchId: string, input: { jumlah?: number | null; siap?: boolean }, now = new Date()): Promise<Hasil> {
  const club = clubMilik(adminId);
  const m = db.select().from(matches).where(eq(matches.id, matchId)).get();
  if (!club || !m || !peserta(m, club.id)) return { ok: false, error: "Match tidak ditemukan." };
  if (m.status !== "terkonfirmasi") return { ok: false, error: "Kesiapan hanya untuk match terkonfirmasi." };
  if (terkunci(m, now)) return { ok: false, error: "Kesiapan terkunci 2 jam sebelum kick-off. Koordinasikan lewat chat." };
  if (input.jumlah != null && (!Number.isInteger(input.jumlah) || input.jumlah < 0 || input.jumlah > 40)) return { ok: false, error: "Jumlah pemain tidak valid." };
  const min = MIN_PEMAIN[m.format];

  const hasil = db.transaction((tx) => {
    tx.insert(matchReadiness).values({ matchId, clubId: club.id, updatedAt: now }).onConflictDoNothing().run();
    const lama = tx.select().from(matchReadiness).where(and(eq(matchReadiness.matchId, matchId), eq(matchReadiness.clubId, club.id))).get()!;
    if (input.jumlah !== undefined) {
      const manual = input.jumlah !== null || jumlahAnggota(tx, club.id) === 0;
      tx.update(matchReadiness)
        .set({ manualOverride: manual, playersReady: input.jumlah ?? lama.playersReady, updatedBy: adminId, updatedAt: now })
        .where(and(eq(matchReadiness.matchId, matchId), eq(matchReadiness.clubId, club.id)))
        .run();
    }
    const dicabut = hitungUlangKesiapan(tx, matchId, club.id, m.format, now);
    const kini = tx.select().from(matchReadiness).where(and(eq(matchReadiness.matchId, matchId), eq(matchReadiness.clubId, club.id))).get()!;
    if (input.siap === true && kini.playersReady < min) return { error: `Lengkapi minimal ${min} pemain dulu.` } as const;
    if (input.siap !== undefined) {
      tx.update(matchReadiness).set({ isReady: input.siap, updatedBy: adminId, updatedAt: now }).where(and(eq(matchReadiness.matchId, matchId), eq(matchReadiness.clubId, club.id))).run();
    }
    const berubahJumlah = kini.playersReady !== lama.playersReady;
    const berubahSiap = input.siap !== undefined && input.siap !== lama.isReady;
    if (berubahSiap) pesanSistem(tx, matchId, input.siap ? `${club.name} siap main dengan ${kini.playersReady} pemain.` : `${club.name} menandai belum siap.`, now);
    else if (berubahJumlah) pesanSistem(tx, matchId, `${club.name} mengubah jumlah pemain siap menjadi ${kini.playersReady}.`, now);
    return { dicabut, kabari: berubahJumlah || (berubahSiap && input.siap === false) } as const;
  });
  if ("error" in hasil) return { ok: false, error: hasil.error! };
  if (hasil.dicabut) await kabariPencabutan(m, club.id, now);
  else if (hasil.kabari) {
    const lawan = lawanDari(m, club.id);
    const admin = lawan && db.select({ id: clubs.adminUserId }).from(clubs).where(eq(clubs.id, lawan)).get()?.id;
    if (admin) await beritahu([admin], { trigger: "kesiapan_lawan", title: `${club.name} memperbarui kesiapan`, url: `/club/match/${matchId}` });
  }
  return { ok: true };
}
