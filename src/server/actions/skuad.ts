"use server";

import { revalidatePath } from "next/cache";
import { teks, type FormState } from "@/lib/form-state";
import { requireRole } from "@/server/authz";
import { appUrl } from "@/server/notify/email";
import {
  batalkanPermintaan,
  buatUndangan,
  cabutUndangan,
  gantiKodeSkuad,
  keluarkanAnggota,
  keluarSkuad,
  mintaGabung,
  putuskanPermintaan,
} from "@/server/skuad";

// ── Admin club ──────────────────────────────────────────────────────────────

export async function buatUndanganAction(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await requireRole("club_admin");
  const r = buatUndangan(user.id);
  return r.ok ? { ok: true, url: appUrl(`/undangan/${r.token}`) } : r;
}

export async function cabutUndanganAction() {
  const user = await requireRole("club_admin");
  cabutUndangan(user.id);
  revalidatePath("/club/skuad");
}

export async function gantiKodeAction() {
  const user = await requireRole("club_admin");
  gantiKodeSkuad(user.id);
  revalidatePath("/club/skuad");
}

export async function putuskanPermintaanAction(membershipId: string, setuju: boolean): Promise<{ ok: boolean; error?: string }> {
  const user = await requireRole("club_admin");
  const r = await putuskanPermintaan(user.id, membershipId, setuju);
  revalidatePath("/club", "layout");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function keluarkanAnggotaAction(membershipId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireRole("club_admin");
  const r = await keluarkanAnggota(user.id, membershipId);
  revalidatePath("/club", "layout");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

// ── Pemain ──────────────────────────────────────────────────────────────────

export async function mintaGabungAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("player");
  const token = teks(fd, "token");
  const kode = teks(fd, "kode").replace(/\s/g, "");
  if (!token && kode.length !== 6) return { fieldErrors: { kode: "Kode skuad terdiri dari 6 huruf/angka." }, values: { kode } };
  const r = await mintaGabung(user.id, token ? { token } : { kode });
  if (!r.ok) return token ? { error: r.error } : { fieldErrors: { kode: r.error }, values: { kode } };
  revalidatePath("/pemain", "layout");
  return { ok: true, message: `Permintaan terkirim ke ${r.clubName}. Tunggu persetujuan admin club.` };
}

export async function batalkanPermintaanAction() {
  const user = await requireRole("player");
  batalkanPermintaan(user.id);
  revalidatePath("/pemain", "layout");
}

export async function keluarSkuadAction(): Promise<{ ok: boolean; error?: string }> {
  const user = await requireRole("player");
  const r = await keluarSkuad(user.id);
  revalidatePath("/pemain", "layout");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}
