"use server";

import { revalidatePath } from "next/cache";
import { teks, type FormState } from "@/lib/form-state";
import { requireRole } from "@/server/authz";
import { beriPenilaian, checkIn, konfirmasiHasil, mulaiMatch, putuskanSengketa, tambahBukti, type Keputusan } from "@/server/hari-h";

type HasilAksi = { ok: boolean; error?: string };
const segarkan = (matchId: string) => {
  revalidatePath(`/club/match/${matchId}`);
  revalidatePath("/club", "layout");
  revalidatePath("/pemain", "layout");
  revalidatePath("/platform", "layout");
};

export async function checkInAction(matchId: string, lokasi: { lat: number; lng: number } | null): Promise<HasilAksi> {
  const user = await requireRole("club_admin");
  const r = await checkIn(user.id, matchId, lokasi);
  segarkan(matchId);
  return r.ok ? { ok: true } : r;
}

export async function mulaiAction(matchId: string): Promise<HasilAksi> {
  const user = await requireRole("club_admin");
  const r = mulaiMatch(user.id, matchId);
  segarkan(matchId);
  return r.ok ? { ok: true } : r;
}

const angka = (v: string) => (/^\d{1,2}$/.test(v.trim()) ? Number(v) : NaN);

export async function konfirmasiHasilAction(matchId: string, setuju: boolean, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("club_admin");
  if (setuju) {
    const r = await konfirmasiHasil(user.id, matchId, { setuju: true });
    segarkan(matchId);
    return r.ok ? { ok: true, message: "Hasil dikonfirmasi." } : { error: r.error };
  }
  const a = angka(teks(fd, "skorPembuat"));
  const b = angka(teks(fd, "skorLawan"));
  if (Number.isNaN(a) || Number.isNaN(b)) return { fieldErrors: { skor: "Isi skor versi club kamu (0–99)." }, values: { skorPembuat: teks(fd, "skorPembuat"), skorLawan: teks(fd, "skorLawan") } };
  const r = await konfirmasiHasil(user.id, matchId, { setuju: false, skorPembuat: a, skorLawan: b });
  segarkan(matchId);
  return r.ok ? { ok: true, message: "Sanggahan terkirim. Sengketa dibuka." } : { error: r.error };
}

export async function tambahBuktiAction(matchId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("club_admin");
  const r = tambahBukti(user.id, matchId, { catatan: teks(fd, "catatan"), url: teks(fd, "url").trim() || null });
  segarkan(matchId);
  return r.ok ? { ok: true, message: "Bukti terkirim." } : { error: r.error, values: { catatan: teks(fd, "catatan"), url: teks(fd, "url") } };
}

export async function penilaianAction(matchId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("club_admin");
  const r = beriPenilaian(user.id, matchId, { sportivitas: Number(teks(fd, "sportivitas")), kerapian: Number(teks(fd, "kerapian")), komentar: teks(fd, "komentar").trim() || null });
  segarkan(matchId);
  return r.ok ? { ok: true, message: "Penilaian tersimpan." } : { error: r.error };
}

export async function putuskanSengketaAction(matchId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("platform_admin");
  const keputusan = teks(fd, "keputusan") as Keputusan;
  if (!["pengusul", "penyanggah", "koreksi", "batal"].includes(keputusan)) return { fieldErrors: { keputusan: "Pilih keputusan." } };
  const skor: [number, number] | undefined = keputusan === "koreksi" ? [angka(teks(fd, "skorPembuat")), angka(teks(fd, "skorLawan"))] : undefined;
  const r = await putuskanSengketa(user.id, matchId, { keputusan, skor, alasan: teks(fd, "alasan") });
  segarkan(matchId);
  return r.ok ? { ok: true, message: "Keputusan tersimpan dan dikirim ke kedua club." } : { error: r.error, values: { alasan: teks(fd, "alasan"), keputusan } };
}
