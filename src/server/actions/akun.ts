"use server";

import { redirect } from "next/navigation";
import { teks, type FormState } from "@/lib/form-state";
import { endSession } from "@/server/auth/session";
import { hapusAkunPemain } from "@/server/akun";
import { requireRole } from "@/server/authz";

/** Pemain menghapus akunnya sendiri; wajib konfirmasi password. */
export async function hapusAkunAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireRole("player");
  const r = await hapusAkunPemain(user.id, teks(fd, "password"));
  if (!r.ok) return { error: r.error };
  await endSession();
  redirect("/masuk?akun=dihapus");
}
