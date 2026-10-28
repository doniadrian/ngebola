import "server-only";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, clubPhotos, clubs } from "@/db/schema";
import type { ClubInput } from "@/lib/validasi";
import { inisialDari, kunciNama, slugify } from "@/lib/slug";
import { randomCode } from "./auth/crypto";
import { hapusBerkas, simpanGambar } from "./berkas";
import { beritahu, idAdminPlatform } from "./notify";

export const MAKS_FOTO_GALERI = 10;
type Hasil<T = object> = ({ ok: true } & T) | { ok: false; error: string; field?: string };

export const clubMilik = (adminUserId: string) => db.select().from(clubs).where(eq(clubs.adminUserId, adminUserId)).get();

function slugUnik(nama: string, kecuali?: string) {
  const dasar = slugify(nama);
  for (let i = 1; ; i++) {
    const slug = i === 1 ? dasar : `${dasar}-${i}`;
    const ada = db.select({ id: clubs.id }).from(clubs).where(eq(clubs.slug, slug)).get();
    if (!ada || ada.id === kecuali) return slug;
  }
}

function kodeUnik() {
  for (;;) {
    const kode = randomCode();
    if (!db.select({ id: clubs.id }).from(clubs).where(eq(clubs.squadCode, kode)).get()) return kode;
  }
}

/**
 * Registrasi club baru (A-02, A-04) atau perbarui profil club sendiri (C-01).
 * Satu akun Admin club = satu club. Nama unik per kota. Club Ditolak yang diperbarui otomatis diajukan ulang.
 */
export async function simpanClub(adminUserId: string, data: ClubInput, logo: File | null): Promise<Hasil<{ clubId: string; baru: boolean; diajukanUlang: boolean }>> {
  const lama = clubMilik(adminUserId);
  const nameKey = kunciNama(data.name);
  const bentrok = db
    .select({ id: clubs.id })
    .from(clubs)
    .where(and(eq(clubs.city, "Pekanbaru"), eq(clubs.nameKey, nameKey), lama ? ne(clubs.id, lama.id) : undefined))
    .get();
  if (bentrok) return { ok: false, field: "name", error: "Nama club ini sudah dipakai di Pekanbaru." };

  let logoPath = lama?.logoPath ?? null;
  if (logo) {
    const up = await simpanGambar(logo, "logo");
    if (!up.ok) return { ok: false, field: "logo", error: up.error };
    logoPath = up.path;
  }

  const now = new Date();
  const nilai = {
    name: data.name,
    nameKey,
    area: data.area,
    level: data.level,
    foundedYear: data.foundedYear ?? null,
    description: data.description ?? null,
    contactPhone: data.contactPhone,
    crestColor: data.crestColor,
    jerseyHome: data.jerseyHome,
    jerseyAway: data.jerseyAway,
    initials: inisialDari(data.name),
    logoPath,
    updatedAt: now,
  };

  if (!lama) {
    const id = crypto.randomUUID();
    db.insert(clubs).values({ id, adminUserId, slug: slugUnik(data.name), squadCode: kodeUnik(), registrationStatus: "diajukan", createdAt: now, ...nilai }).run();
    await beritahu(idAdminPlatform(), { trigger: "registrasi_club", title: `Registrasi club baru: ${data.name}`, body: "Menunggu verifikasi.", url: "/platform/verifikasi" });
    return { ok: true, clubId: id, baru: true, diajukanUlang: false };
  }

  const diajukanUlang = lama.registrationStatus === "ditolak";
  db.update(clubs)
    .set({ ...nilai, slug: lama.name === data.name ? lama.slug : slugUnik(data.name, lama.id), ...(diajukanUlang ? { registrationStatus: "diajukan" as const, rejectionReason: null } : {}) })
    .where(eq(clubs.id, lama.id))
    .run();
  if (logo && lama.logoPath && lama.logoPath !== logoPath) hapusBerkas(lama.logoPath);
  if (diajukanUlang) {
    await beritahu(idAdminPlatform(), { trigger: "registrasi_club", title: `Registrasi diajukan ulang: ${data.name}`, url: "/platform/verifikasi" });
  }
  return { ok: true, clubId: lama.id, baru: false, diajukanUlang };
}

export function hapusLogo(adminUserId: string): Hasil {
  const c = clubMilik(adminUserId);
  if (!c) return { ok: false, error: "Club tidak ditemukan." };
  db.update(clubs).set({ logoPath: null, updatedAt: new Date() }).where(eq(clubs.id, c.id)).run();
  hapusBerkas(c.logoPath);
  return { ok: true };
}

export async function tambahFoto(adminUserId: string, file: File): Promise<Hasil> {
  const c = clubMilik(adminUserId);
  if (!c) return { ok: false, error: "Daftarkan club dulu." };
  const [{ n }] = db.select({ n: count() }).from(clubPhotos).where(eq(clubPhotos.clubId, c.id)).all();
  if (n >= MAKS_FOTO_GALERI) return { ok: false, error: `Galeri maksimal ${MAKS_FOTO_GALERI} foto. Hapus satu dulu.` };
  const up = await simpanGambar(file, "galeri");
  if (!up.ok) return { ok: false, error: up.error };
  db.insert(clubPhotos).values({ clubId: c.id, path: up.path, sortOrder: n }).run();
  return { ok: true };
}

export function hapusFoto(adminUserId: string, fotoId: string): Hasil {
  const c = clubMilik(adminUserId);
  const foto = c && db.select().from(clubPhotos).where(and(eq(clubPhotos.id, fotoId), eq(clubPhotos.clubId, c.id))).get();
  if (!foto) return { ok: false, error: "Foto tidak ditemukan." };
  db.delete(clubPhotos).where(eq(clubPhotos.id, foto.id)).run();
  hapusBerkas(foto.path);
  return { ok: true };
}

// ── Verifikasi oleh Admin platform (A-04, 9.1) ──────────────────────────────

export async function putuskanRegistrasi(platformUserId: string, clubId: string, keputusan: "setujui" | "tolak", alasan?: string): Promise<Hasil> {
  const c = db.select().from(clubs).where(eq(clubs.id, clubId)).get();
  if (!c) return { ok: false, error: "Club tidak ditemukan." };
  if (c.registrationStatus !== "diajukan") return { ok: false, error: "Registrasi ini sudah diputuskan." };
  if (keputusan === "tolak" && !alasan) return { ok: false, field: "alasan", error: "Alasan penolakan wajib diisi." };

  const now = new Date();
  db.transaction((tx) => {
    tx.update(clubs)
      .set({
        registrationStatus: keputusan === "setujui" ? "disetujui" : "ditolak",
        rejectionReason: keputusan === "tolak" ? alasan : null,
        reviewedBy: platformUserId,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(clubs.id, clubId))
      .run();
    tx.insert(auditLogs)
      .values({ actorUserId: platformUserId, action: keputusan === "setujui" ? "setujui_club" : "tolak_club", targetType: "club", targetId: clubId, reason: alasan ?? null, createdAt: now })
      .run();
  });

  await beritahu(
    [c.adminUserId],
    keputusan === "setujui"
      ? { trigger: "status_registrasi", title: `${c.name} disetujui`, body: "Club kamu sudah bisa membuat match dan menerima tantangan.", url: "/club" }
      : { trigger: "status_registrasi", title: `Registrasi ${c.name} ditolak`, body: `Alasan: ${alasan}. Perbaiki data lalu ajukan ulang.`, url: "/club/daftar-club" },
    { email: true },
  );
  return { ok: true };
}

/** Club boleh bertanding: disetujui dan tidak ditangguhkan (A-04). */
export const bolehBertanding = (c: { registrationStatus: string; suspendedAt: Date | null } | null | undefined) =>
  !!c && c.registrationStatus === "disetujui" && !c.suspendedAt;
