"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nilaiForm, type FormState } from "@/lib/form-state";
import { clubSchema, fieldErrors } from "@/lib/validasi";
import { requireRole } from "@/server/authz";
import { fileDari } from "@/server/berkas";
import { hapusFoto, hapusLogo, simpanClub, tambahFoto } from "@/server/club";

/** Registrasi club baru, pengajuan ulang setelah ditolak, atau perbarui profil club sendiri. */
export async function simpanClubAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("club_admin");
  const values = nilaiForm(fd);
  const parsed = clubSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const r = await simpanClub(user.id, parsed.data, fileDari(fd, "logo"));
  if (!r.ok) return r.field ? { fieldErrors: { [r.field]: r.error }, values } : { error: r.error, values };

  revalidatePath("/", "layout");
  if (r.baru || r.diajukanUlang) redirect("/club?registrasi=diajukan");
  return { ok: true, message: "Profil club tersimpan.", values };
}

export async function hapusLogoAction() {
  const user = await requireRole("club_admin");
  hapusLogo(user.id);
  revalidatePath("/", "layout");
}

export async function tambahFotoAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("club_admin");
  const file = fileDari(fd, "foto");
  if (!file) return { error: "Pilih foto dulu." };
  const r = await tambahFoto(user.id, file);
  if (!r.ok) return { error: r.error };
  revalidatePath("/club/profil");
  return { ok: true, message: "Foto ditambahkan ke galeri." };
}

export async function hapusFotoAction(fotoId: string) {
  const user = await requireRole("club_admin");
  hapusFoto(user.id, fotoId);
  revalidatePath("/club/profil");
}
