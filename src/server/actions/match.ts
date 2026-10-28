"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ALASAN_BATAL, JAWABAN_RSVP } from "@/db/enums";
import { bacaLapangan, bacaOpsi, bacaUsulan, matchBaruSchema } from "@/lib/form-match";
import { nilaiForm, teks, type FormState } from "@/lib/form-state";
import { fieldErrors } from "@/lib/validasi";
import { JAM } from "@/lib/waktu";
import { requireRole } from "@/server/authz";
import { aturBlokir, kirimPesan, laporkan } from "@/server/chat";
import { aturKesiapan, simpanRsvp } from "@/server/kesiapan";
import {
  ajukanPerubahan,
  batalkanMatch,
  buatMatch,
  hapusDraf,
  putuskanPerubahan,
  tarikAjakan,
  tawarBalik,
  terbitkanDraf,
  terimaUsulan,
  tolakAjakan,
} from "@/server/match";

type HasilAksi = { ok: boolean; error?: string };
const segarkan = (matchId?: string) => {
  revalidatePath("/club", "layout");
  revalidatePath("/pemain", "layout");
  if (matchId) revalidatePath(`/club/match/${matchId}`);
};

/** Match terbuka (M-01) atau tantangan langsung ke club tertentu (M-03, M-07 rematch). */
export async function buatMatchAction(jenis: "terbuka" | "tantangan", lawanClubId: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("club_admin");
  const values = nilaiForm(fd);
  const dasar = matchBaruSchema.safeParse(values);
  const usulan = bacaUsulan(fd, new Date(), true);
  const errors = { ...(dasar.success ? {} : fieldErrors(dasar.error)), ...(usulan.ok ? {} : usulan.fieldErrors) };
  if (!dasar.success || !usulan.ok) return { fieldErrors: errors, values };

  const r = await buatMatch(user.id, {
    jenis,
    lawanClubId: lawanClubId ?? undefined,
    format: dasar.data.format,
    area: dasar.data.area,
    level: dasar.data.level,
    usulan: usulan.data,
    rematchOf: teks(fd, "rematchOf") || undefined,
  });
  if (!r.ok) return { error: r.error, values };
  segarkan();
  redirect(`/club/match/${r.matchId}?baru=1`);
}

export async function terimaAction(matchId: string, proposalId: string): Promise<HasilAksi> {
  const user = await requireRole("club_admin");
  const r = await terimaUsulan(user.id, matchId, proposalId);
  segarkan(matchId);
  return r.ok ? { ok: true } : r;
}

export async function tolakAction(matchId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("club_admin");
  const r = await tolakAjakan(user.id, matchId, teks(fd, "alasan").trim().slice(0, 300) || null);
  segarkan(matchId);
  return r.ok ? { ok: true } : { error: r.error };
}

export async function tawarBalikAction(matchId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("club_admin");
  const values = nilaiForm(fd);
  const usulan = bacaUsulan(fd, new Date(), true);
  if (!usulan.ok) return { fieldErrors: usulan.fieldErrors, values };
  const r = await tawarBalik(user.id, matchId, usulan.data);
  if (!r.ok) return { error: r.error, values };
  segarkan(matchId);
  return { ok: true, message: "Tawaran terkirim." };
}

export async function tarikAction(matchId: string): Promise<HasilAksi> {
  const user = await requireRole("club_admin");
  const r = await tarikAjakan(user.id, matchId);
  segarkan(matchId);
  return r.ok ? { ok: true } : r;
}

export async function terbitkanDrafAction(matchId: string): Promise<HasilAksi> {
  const user = await requireRole("club_admin");
  const r = await terbitkanDraf(user.id, matchId);
  segarkan(matchId);
  return r.ok ? { ok: true } : r;
}

export async function hapusDrafAction(matchId: string) {
  const user = await requireRole("club_admin");
  hapusDraf(user.id, matchId);
  segarkan();
  redirect("/club/jadwal");
}

export async function batalkanAction(matchId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("club_admin");
  const alasan = teks(fd, "alasan");
  const values = nilaiForm(fd);
  if (!(ALASAN_BATAL as readonly string[]).includes(alasan) || alasan === "tidak_hadir") return { fieldErrors: { alasan: "Pilih alasan pembatalan." }, values };
  const catatan = teks(fd, "catatan").trim().slice(0, 300);
  if (catatan.length < 5) return { fieldErrors: { catatan: "Tulis catatan singkat untuk lawan." }, values };
  const r = await batalkanMatch(user.id, matchId, { alasan: alasan as (typeof ALASAN_BATAL)[number], catatan, bukti: teks(fd, "bukti").trim().slice(0, 300) || null });
  if (!r.ok) return { error: r.error, values };
  segarkan(matchId);
  return { ok: true, message: r.mendadak ? "Match dibatalkan. Karena kurang dari 24 jam, keandalan club turun." : "Match dibatalkan." };
}

export async function ajukanPerubahanAction(matchId: string, jenis: "jadwal" | "lapangan" | "tunda", _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("club_admin");
  const values = nilaiForm(fd);
  let r;
  if (jenis === "jadwal") {
    // Jadwal baru (perubahan/penundaan) cukup ≥ 3 jam lagi.
    const { opsi, error } = bacaOpsi(fd, new Date(), 3 * JAM);
    if (error || opsi.length !== 1) return { fieldErrors: { opsi: error ?? "Isi satu jadwal baru." }, values };
    r = await ajukanPerubahan(user.id, matchId, { jenis, startsAt: opsi[0] });
  } else if (jenis === "lapangan") {
    const { lapangan, error } = bacaLapangan(fd, true);
    if (error) return { fieldErrors: { venueId: error }, values };
    r = await ajukanPerubahan(user.id, matchId, { jenis, lapangan });
  } else {
    const alasan = teks(fd, "alasan").trim().slice(0, 300);
    if (alasan.length < 5) return { fieldErrors: { alasan: "Tulis alasan penundaan, mis. hujan deras / lapangan tergenang." }, values };
    r = await ajukanPerubahan(user.id, matchId, { jenis, alasan, bukti: teks(fd, "bukti").trim().slice(0, 300) || null });
  }
  if (!r.ok) return { error: r.error, values };
  segarkan(matchId);
  return { ok: true, message: "Usulan terkirim. Menunggu persetujuan lawan." };
}

export async function putuskanPerubahanAction(matchId: string, requestId: string, setuju: boolean): Promise<HasilAksi> {
  const user = await requireRole("club_admin");
  const r = await putuskanPerubahan(user.id, requestId, setuju);
  segarkan(matchId);
  return r.ok ? { ok: true } : r;
}

export async function kesiapanAction(matchId: string, input: { jumlah?: number | null; siap?: boolean }): Promise<HasilAksi> {
  const user = await requireRole("club_admin");
  const r = await aturKesiapan(user.id, matchId, input);
  segarkan(matchId);
  return r.ok ? { ok: true } : r;
}

export async function rsvpAction(matchId: string, jawaban: string): Promise<HasilAksi> {
  const user = await requireRole("player");
  if (!(JAWABAN_RSVP as readonly string[]).includes(jawaban)) return { ok: false, error: "Jawaban tidak valid." };
  const r = await simpanRsvp(user.id, matchId, jawaban as (typeof JAWABAN_RSVP)[number]);
  segarkan(matchId);
  return r.ok ? { ok: true } : r;
}

export async function kirimPesanAction(matchId: string, input: { body: string; lat?: number; lng?: number }): Promise<HasilAksi> {
  const user = await requireRole("club_admin");
  const r = kirimPesan(user.id, matchId, input);
  return r.ok ? { ok: true } : r;
}

export async function laporkanAction(targetType: "pesan" | "ulasan" | "club", targetId: string, alasan: string): Promise<HasilAksi> {
  const user = await requireRole("club_admin", "player");
  const r = laporkan(user.id, { targetType, targetId, alasan });
  return r.ok ? { ok: true } : r;
}

export async function blokirAction(targetClubId: string, blokir: boolean): Promise<HasilAksi> {
  const user = await requireRole("club_admin");
  const r = aturBlokir(user.id, targetClubId, blokir);
  segarkan();
  return r.ok ? { ok: true } : r;
}
