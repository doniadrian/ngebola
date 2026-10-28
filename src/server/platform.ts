import "server-only";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, chatMessages, clubs, matches, moderationFlags, platformSettings, reports, reviews, scheduleProposals, users, venues, venueSlots } from "@/db/schema";
import { AREA, LEVEL, PERMUKAAN } from "@/db/enums";
import { kunciNama } from "@/lib/slug";
import { revokeAllSessions } from "./auth/service";
import { pesanSistem } from "./match";
import { beritahu } from "./notify";

type Hasil<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const audit = (actor: string, action: string, targetType: string, targetId: string | null, reason: string, detail?: string) =>
  db.insert(auditLogs).values({ actorUserId: actor, action, targetType, targetId, reason, detail: detail ?? null }).run();
const alasanSah = (a: string) => a.trim().length >= 10;

// ── Club ────────────────────────────────────────────────────────────────────

/** Tangguhkan club (9.1 Moderasi). Match terjadwal & ajakan aktifnya dibatalkan tanpa penalti bagi lawan (11.2). */
export async function tangguhkanClub(platformId: string, clubId: string, alasan: string, now = new Date()): Promise<Hasil<{ dibatalkan: number }>> {
  if (!alasanSah(alasan)) return { ok: false, error: "Tulis alasan minimal 10 karakter." };
  const c = db.select().from(clubs).where(eq(clubs.id, clubId)).get();
  if (!c || c.suspendedAt) return { ok: false, error: "Club tidak ditemukan atau sudah ditangguhkan." };
  const terdampak = db
    .select()
    .from(matches)
    .where(and(or(eq(matches.creatorClubId, clubId), eq(matches.opponentClubId, clubId)), inArray(matches.status, ["terbuka", "ditantang", "dinegosiasi", "terkonfirmasi", "ditunda", "draf"])))
    .all();
  db.transaction((tx) => {
    tx.update(clubs).set({ suspendedAt: now, suspensionReason: alasan.trim(), updatedAt: now }).where(eq(clubs.id, clubId)).run();
    for (const m of terdampak) {
      tx.update(matches).set({ status: "dibatalkan", cancelledByClubId: clubId, cancelReason: "lainnya", cancelNote: "Club ditangguhkan Admin platform. Tanpa penalti bagi lawan.", lateCancel: false, responseDeadline: null, updatedAt: now }).where(eq(matches.id, m.id)).run();
      tx.update(scheduleProposals).set({ status: "kedaluwarsa" }).where(and(eq(scheduleProposals.matchId, m.id), eq(scheduleProposals.status, "menunggu"))).run();
      if (m.opponentClubId) pesanSistem(tx, m.id, `${c.name} ditangguhkan Admin platform. Match dibatalkan tanpa penalti bagi lawan.`, now);
    }
  });
  audit(platformId, "tangguhkan_club", "club", clubId, alasan.trim(), `${terdampak.length} match dibatalkan`);
  await beritahu([c.adminUserId], { trigger: "moderasi", title: `${c.name} ditangguhkan`, body: alasan.trim(), url: "/club" }, { email: true });
  const lawan = terdampak.map((m) => (m.creatorClubId === clubId ? m.opponentClubId : m.creatorClubId)).filter((x): x is string => !!x);
  const adminLawan = lawan.length ? db.select({ id: clubs.adminUserId }).from(clubs).where(inArray(clubs.id, lawan)).all().map((r) => r.id) : [];
  await beritahu(adminLawan, { trigger: "match_dibatalkan", title: `Match dengan ${c.name} dibatalkan tanpa penalti`, url: "/club/jadwal?tab=riwayat" });
  return { ok: true, dibatalkan: terdampak.length };
}

export async function cabutPenangguhan(platformId: string, clubId: string, alasan: string): Promise<Hasil> {
  if (!alasanSah(alasan)) return { ok: false, error: "Tulis alasan minimal 10 karakter." };
  const c = db.select().from(clubs).where(eq(clubs.id, clubId)).get();
  if (!c?.suspendedAt) return { ok: false, error: "Club tidak sedang ditangguhkan." };
  db.update(clubs).set({ suspendedAt: null, suspensionReason: null, updatedAt: new Date() }).where(eq(clubs.id, clubId)).run();
  audit(platformId, "cabut_penangguhan", "club", clubId, alasan.trim());
  await beritahu([c.adminUserId], { trigger: "moderasi", title: `Penangguhan ${c.name} dicabut`, url: "/club" }, { email: true });
  return { ok: true };
}

export async function peringatkanClub(platformId: string, clubId: string, pesan: string): Promise<Hasil> {
  if (!alasanSah(pesan)) return { ok: false, error: "Tulis isi peringatan minimal 10 karakter." };
  const c = db.select().from(clubs).where(eq(clubs.id, clubId)).get();
  if (!c) return { ok: false, error: "Club tidak ditemukan." };
  audit(platformId, "peringatan_club", "club", clubId, pesan.trim());
  await beritahu([c.adminUserId], { trigger: "moderasi", title: `Peringatan untuk ${c.name}`, body: pesan.trim(), url: "/club/notifikasi" }, { email: true });
  return { ok: true };
}

/** Koreksi data club dengan alasan (9.1 Dukungan). */
export function koreksiClub(platformId: string, clubId: string, data: { name: string; area: string; level: string }, alasan: string): Hasil {
  if (!alasanSah(alasan)) return { ok: false, error: "Tulis alasan minimal 10 karakter." };
  const c = db.select().from(clubs).where(eq(clubs.id, clubId)).get();
  if (!c) return { ok: false, error: "Club tidak ditemukan." };
  const name = data.name.trim();
  if (name.length < 3 || name.length > 60) return { ok: false, error: "Nama club 3–60 huruf." };
  if (!(AREA as readonly string[]).includes(data.area) || !(LEVEL as readonly string[]).includes(data.level)) return { ok: false, error: "Area/level tidak valid." };
  const bentrok = db.select({ id: clubs.id }).from(clubs).where(and(eq(clubs.city, c.city), eq(clubs.nameKey, kunciNama(name)))).get();
  if (bentrok && bentrok.id !== clubId) return { ok: false, error: "Nama ini sudah dipakai club lain." };
  db.update(clubs).set({ name, nameKey: kunciNama(name), area: data.area as typeof c.area, level: data.level as typeof c.level, updatedAt: new Date() }).where(eq(clubs.id, clubId)).run();
  audit(platformId, "koreksi_club", "club", clubId, alasan.trim(), `${c.name}/${c.area}/${c.level} → ${name}/${data.area}/${data.level}`);
  return { ok: true };
}

// ── Akun ────────────────────────────────────────────────────────────────────

export function aturStatusAkun(platformId: string, userId: string, status: "aktif" | "nonaktif", alasan: string): Hasil {
  if (!alasanSah(alasan)) return { ok: false, error: "Tulis alasan minimal 10 karakter." };
  if (userId === platformId) return { ok: false, error: "Tidak bisa mengubah akun sendiri." };
  const u = db.select().from(users).where(eq(users.id, userId)).get();
  if (!u) return { ok: false, error: "Pengguna tidak ditemukan." };
  db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId)).run();
  if (status === "nonaktif") revokeAllSessions(userId);
  audit(platformId, status === "nonaktif" ? "nonaktifkan_akun" : "aktifkan_akun", "user", userId, alasan.trim());
  return { ok: true };
}

// ── Laporan & anti-manipulasi ───────────────────────────────────────────────

/** Tindak laporan: sembunyikan pesan / kecualikan ulasan / tolak laporan. Selalu tercatat di audit. */
export function tindakLaporan(platformId: string, reportId: string, aksi: "tindak" | "tolak", catatan: string): Hasil {
  if (catatan.trim().length < 5) return { ok: false, error: "Tulis catatan tindakan." };
  const r = db.select().from(reports).where(eq(reports.id, reportId)).get();
  if (!r || r.status !== "terbuka") return { ok: false, error: "Laporan tidak ditemukan atau sudah ditangani." };
  db.transaction((tx) => {
    if (aksi === "tindak" && r.targetType === "pesan") tx.update(chatMessages).set({ hiddenByModerator: true }).where(eq(chatMessages.id, r.targetId)).run();
    if (aksi === "tindak" && r.targetType === "ulasan") tx.update(reviews).set({ excluded: true }).where(eq(reviews.id, r.targetId)).run();
    tx.update(reports).set({ status: aksi === "tindak" ? "ditindak" : "ditolak", resolvedBy: platformId, resolution: catatan.trim(), resolvedAt: new Date() }).where(eq(reports.id, reportId)).run();
    tx.insert(auditLogs).values({ actorUserId: platformId, action: `laporan_${aksi}`, targetType: r.targetType, targetId: r.targetId, reason: catatan.trim() }).run();
  });
  return { ok: true };
}

export function tinjauFlag(platformId: string, flagId: string, status: "ditinjau" | "diabaikan", catatan: string): Hasil {
  if (catatan.trim().length < 5) return { ok: false, error: "Tulis catatan tinjauan." };
  const f = db.select().from(moderationFlags).where(eq(moderationFlags.id, flagId)).get();
  if (!f || f.status !== "terbuka") return { ok: false, error: "Tanda tidak ditemukan." };
  db.update(moderationFlags).set({ status, resolvedBy: platformId, resolvedAt: new Date() }).where(eq(moderationFlags.id, flagId)).run();
  audit(platformId, `flag_${status}`, "moderation_flag", flagId, catatan.trim(), f.kind);
  return { ok: true };
}

// ── Lapangan (V-01, V-02) ───────────────────────────────────────────────────

export type InputVenue = {
  name: string;
  address: string;
  area: string;
  lat: number | null;
  lng: number | null;
  surface: string;
  forFootball: boolean;
  forMini: boolean;
  pricePerHour: number | null;
  openHours: string | null;
  facilities: string | null;
  contact: string | null;
  verified: boolean;
};

export function simpanVenue(platformId: string, id: string | null, v: InputVenue): Hasil<{ id: string }> {
  if (v.name.trim().length < 3 || v.address.trim().length < 5) return { ok: false, error: "Isi nama dan alamat lapangan." };
  if (!(AREA as readonly string[]).includes(v.area) || !(PERMUKAAN as readonly string[]).includes(v.surface)) return { ok: false, error: "Area/permukaan tidak valid." };
  if (!v.forFootball && !v.forMini) return { ok: false, error: "Pilih minimal satu format." };
  if ((v.lat != null && Math.abs(v.lat) > 90) || (v.lng != null && Math.abs(v.lng) > 180)) return { ok: false, error: "Koordinat tidak valid." };
  const nilai = { ...v, name: v.name.trim(), address: v.address.trim(), area: v.area as (typeof AREA)[number], surface: v.surface as (typeof PERMUKAAN)[number], managedBy: platformId, updatedAt: new Date() };
  const vid = id ?? crypto.randomUUID();
  if (id) db.update(venues).set(nilai).where(eq(venues.id, id)).run();
  else db.insert(venues).values({ id: vid, ...nilai }).run();
  audit(platformId, id ? "ubah_lapangan" : "tambah_lapangan", "venue", vid, "Kelola direktori lapangan", nilai.name);
  return { ok: true, id: vid };
}

export function tambahSlot(platformId: string, venueId: string, s: { dayOfWeek: number; startTime: string; endTime: string; note: string | null }): Hasil {
  if (!Number.isInteger(s.dayOfWeek) || s.dayOfWeek < 0 || s.dayOfWeek > 6 || !/^\d{2}:\d{2}$/.test(s.startTime) || !/^\d{2}:\d{2}$/.test(s.endTime) || s.startTime >= s.endTime) {
    return { ok: false, error: "Slot tidak valid (jam selesai harus setelah jam mulai)." };
  }
  if (!db.select({ id: venues.id }).from(venues).where(eq(venues.id, venueId)).get()) return { ok: false, error: "Lapangan tidak ditemukan." };
  db.insert(venueSlots).values({ venueId, ...s }).run();
  audit(platformId, "tambah_slot", "venue", venueId, "Info slot lapangan", `${s.dayOfWeek} ${s.startTime}-${s.endTime}`);
  return { ok: true };
}

export function hapusSlot(platformId: string, slotId: string): Hasil {
  const s = db.select().from(venueSlots).where(eq(venueSlots.id, slotId)).get();
  if (!s) return { ok: false, error: "Slot tidak ditemukan." };
  db.delete(venueSlots).where(eq(venueSlots.id, slotId)).run();
  audit(platformId, "hapus_slot", "venue", s.venueId, "Info slot lapangan");
  return { ok: true };
}

// ── Konfigurasi (9.1) ───────────────────────────────────────────────────────

export const PENGATURAN = [
  { key: "rating.awal", label: "Rating awal club baru", bawaan: 1200, min: 800, max: 2000 },
  { key: "rating.k_baru", label: "Faktor K (10 match pertama)", bawaan: 40, min: 8, max: 80 },
  { key: "rating.k_lama", label: "Faktor K (setelahnya)", bawaan: 24, min: 8, max: 80 },
  { key: "rating.batas_baru", label: "Jumlah match dengan K besar", bawaan: 10, min: 1, max: 50 },
  { key: "match.maks_terbuka", label: "Maksimal match terbuka aktif per club", bawaan: 3, min: 1, max: 10 },
] as const;

export function bacaPengaturan() {
  const ada = new Map(db.select().from(platformSettings).all().map((s) => [s.key, Number(s.value)]));
  return PENGATURAN.map((p) => ({ ...p, nilai: ada.get(p.key) ?? p.bawaan }));
}

export function simpanPengaturan(platformId: string, nilai: Record<string, number>, alasan: string): Hasil {
  if (!alasanSah(alasan)) return { ok: false, error: "Tulis alasan perubahan minimal 10 karakter." };
  for (const p of PENGATURAN) {
    const v = nilai[p.key];
    if (!Number.isInteger(v) || v < p.min || v > p.max) return { ok: false, error: `${p.label}: ${p.min}–${p.max}.` };
  }
  const lama = bacaPengaturan();
  db.transaction((tx) => {
    for (const p of PENGATURAN) {
      tx.insert(platformSettings)
        .values({ key: p.key, value: String(nilai[p.key]), updatedBy: platformId, updatedAt: new Date() })
        .onConflictDoUpdate({ target: platformSettings.key, set: { value: String(nilai[p.key]), updatedBy: platformId, updatedAt: new Date() } })
        .run();
    }
  });
  const beda = lama.filter((l) => l.nilai !== nilai[l.key]).map((l) => `${l.key}: ${l.nilai} → ${nilai[l.key]}`);
  audit(platformId, "ubah_pengaturan", "platform_settings", null, alasan.trim(), beda.join("; ") || "tanpa perubahan");
  return { ok: true };
}
