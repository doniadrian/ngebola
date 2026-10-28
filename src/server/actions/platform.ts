"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nilaiForm, teks, type FormState } from "@/lib/form-state";
import { bacaRupiah } from "@/lib/form-match";
import { alasanSchema } from "@/lib/validasi";
import { requireRole } from "@/server/authz";
import { putuskanRegistrasi } from "@/server/club";
import {
  aturStatusAkun,
  cabutPenangguhan,
  hapusSlot,
  koreksiClub,
  peringatkanClub,
  PENGATURAN,
  simpanPengaturan,
  simpanVenue,
  tambahSlot,
  tangguhkanClub,
  tindakLaporan,
  tinjauFlag,
} from "@/server/platform";

type HasilAksi = { ok: boolean; error?: string; message?: string };
const segarkan = () => revalidatePath("/", "layout");

/** Setujui atau tolak registrasi club (A-04). Menolak wajib dengan alasan; semua tercatat di audit. */
export async function putuskanRegistrasiAction(clubId: string, keputusan: "setujui" | "tolak", _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("platform_admin");
  let alasan: string | undefined;
  if (keputusan === "tolak") {
    const p = alasanSchema().safeParse(teks(fd, "alasan"));
    if (!p.success) return { fieldErrors: { alasan: p.error.issues[0].message }, values: { alasan: teks(fd, "alasan") } };
    alasan = p.data;
  }
  const r = await putuskanRegistrasi(user.id, clubId, keputusan, alasan);
  if (!r.ok) return { error: r.error };
  segarkan();
  return { ok: true, message: keputusan === "setujui" ? "Club disetujui." : "Registrasi ditolak." };
}

/** Aksi moderasi beralasan (dialog alasan). */
export async function aksiAlasanAction(jenis: string, targetId: string, alasan: string): Promise<HasilAksi> {
  const user = await requireRole("platform_admin");
  const r =
    jenis === "tangguhkan"
      ? await tangguhkanClub(user.id, targetId, alasan)
      : jenis === "cabut"
        ? await cabutPenangguhan(user.id, targetId, alasan)
        : jenis === "peringatan"
          ? await peringatkanClub(user.id, targetId, alasan)
          : jenis === "nonaktifkan" || jenis === "aktifkan"
            ? aturStatusAkun(user.id, targetId, jenis === "nonaktifkan" ? "nonaktif" : "aktif", alasan)
            : jenis === "laporan-tindak" || jenis === "laporan-tolak"
              ? tindakLaporan(user.id, targetId, jenis === "laporan-tindak" ? "tindak" : "tolak", alasan)
              : jenis === "flag-tinjau" || jenis === "flag-abaikan"
                ? tinjauFlag(user.id, targetId, jenis === "flag-tinjau" ? "ditinjau" : "diabaikan", alasan)
                : jenis === "hapus-slot"
                  ? hapusSlot(user.id, targetId)
                  : { ok: false as const, error: "Aksi tidak dikenal." };
  segarkan();
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function koreksiClubAction(clubId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("platform_admin");
  const r = koreksiClub(user.id, clubId, { name: teks(fd, "name"), area: teks(fd, "area"), level: teks(fd, "level") }, teks(fd, "alasan"));
  segarkan();
  return r.ok ? { ok: true, message: "Data club dikoreksi dan tercatat di audit." } : { error: r.error, values: nilaiForm(fd) };
}

const angkaAtauNull = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

export async function simpanVenueAction(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("platform_admin");
  const harga = bacaRupiah(teks(fd, "pricePerHour"));
  if (harga === "salah") return { error: "Harga tidak valid.", values: nilaiForm(fd) };
  const lat = angkaAtauNull(teks(fd, "lat"));
  const lng = angkaAtauNull(teks(fd, "lng"));
  if ([lat, lng].some((x) => x !== null && Number.isNaN(x))) return { error: "Koordinat harus angka.", values: nilaiForm(fd) };
  const r = simpanVenue(user.id, id, {
    name: teks(fd, "name"),
    address: teks(fd, "address"),
    area: teks(fd, "area"),
    lat,
    lng,
    surface: teks(fd, "surface"),
    forFootball: fd.get("forFootball") === "on",
    forMini: fd.get("forMini") === "on",
    pricePerHour: harga,
    openHours: teks(fd, "openHours").trim() || null,
    facilities: teks(fd, "facilities").trim() || null,
    contact: teks(fd, "contact").trim() || null,
    verified: fd.get("verified") === "on",
  });
  if (!r.ok) return { error: r.error, values: nilaiForm(fd) };
  segarkan();
  if (!id) redirect(`/platform/lapangan/${r.id}`);
  return { ok: true, message: "Lapangan tersimpan." };
}

export async function tambahSlotAction(venueId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("platform_admin");
  const r = tambahSlot(user.id, venueId, { dayOfWeek: Number(teks(fd, "dayOfWeek")), startTime: teks(fd, "startTime"), endTime: teks(fd, "endTime"), note: teks(fd, "note").trim() || null });
  segarkan();
  return r.ok ? { ok: true, message: "Slot ditambahkan." } : { error: r.error };
}

export async function simpanPengaturanAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("platform_admin");
  const nilai = Object.fromEntries(PENGATURAN.map((p) => [p.key, Number(teks(fd, p.key))]));
  const r = simpanPengaturan(user.id, nilai, teks(fd, "alasan"));
  segarkan();
  return r.ok ? { ok: true, message: "Pengaturan tersimpan dan tercatat di audit." } : { error: r.error, values: nilaiForm(fd) };
}
