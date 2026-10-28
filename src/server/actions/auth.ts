"use server";

import { redirect } from "next/navigation";
import { daftarSchema, emailSchema, fieldErrors, masukSchema, resetSchema } from "@/lib/validasi";
import { authenticate, createUser, requestPasswordReset, resetPassword } from "@/server/auth/service";
import { endSession, startSession } from "@/server/auth/session";
import { BERANDA_PERAN } from "@/server/authz";
import { appUrl, sendEmail } from "@/server/notify/email";
import { teks, type FormState } from "@/lib/form-state";
import { PEMAIN_AKTIF } from "@/lib/fitur";
import { VERSI_DOKUMEN } from "@/lib/hukum";

export type { FormState };

/** Tujuan setelah masuk/daftar: hanya path internal (cegah open redirect). */
const lanjutAman = (fd: FormData) => {
  const v = teks(fd, "lanjut");
  return /^\/(?![/\\])/.test(v) ? v : null;
};

export async function daftarAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = { role: teks(fd, "role"), name: teks(fd, "name"), email: teks(fd, "email"), birthDate: teks(fd, "birthDate"), setuju: teks(fd, "setuju") };
  const parsed = daftarSchema(new Date()).safeParse({ ...values, password: teks(fd, "password"), confirmPassword: teks(fd, "confirmPassword") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  if (!PEMAIN_AKTIF && parsed.data.role === "player") return { fieldErrors: { role: "Pendaftaran pemain belum dibuka." }, values };

  // Peran dari formulir hanya club_admin/player (dibatasi schema); Admin platform dibuat lewat perintah internal.
  const { role, name, email, birthDate, password } = parsed.data;
  const result = await createUser({ role, name, email, birthDate, password, consentVersion: VERSI_DOKUMEN });
  if (!result.ok) return { fieldErrors: { email: "Email ini sudah terdaftar. Silakan masuk." }, values };

  await startSession(result.userId);
  redirect(lanjutAman(fd) ?? BERANDA_PERAN[parsed.data.role]);
}

export async function masukAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = { email: teks(fd, "email") };
  const parsed = masukSchema.safeParse({ email: teks(fd, "email"), password: teks(fd, "password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const result = await authenticate(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    const error = {
      salah: "Email atau password salah.",
      terlalu_sering: "Terlalu banyak percobaan gagal. Coba lagi dalam 1 jam, atau atur ulang password.",
      nonaktif: "Akun ini sedang tidak aktif. Hubungi Admin platform.",
    }[result.error];
    return { error, values };
  }

  await startSession(result.userId);
  redirect(lanjutAman(fd) ?? BERANDA_PERAN[result.role]);
}

export async function keluarAction() {
  await endSession();
  redirect("/masuk");
}

export async function lupaPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = { email: teks(fd, "email") };
  const parsed = emailSchema.safeParse(values.email);
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues[0].message }, values };

  const reset = requestPasswordReset(parsed.data);
  if (reset) {
    await sendEmail({
      to: reset.email,
      subject: "Atur ulang password Ngebola",
      text: `Halo ${reset.name},\n\nKetuk tautan ini untuk membuat password baru (berlaku 30 menit, sekali pakai):\n${appUrl(`/reset-password/${reset.token}`)}\n\nKalau kamu tidak meminta ini, abaikan email ini. Password lama tetap berlaku.`,
    });
  }
  // Respons sama untuk semua email supaya keberadaan akun tidak terbuka.
  return { ok: true, message: "Kalau email itu terdaftar, tautan atur ulang sudah dikirim. Berlaku 30 menit.", values };
}

export async function resetPasswordAction(token: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({ password: teks(fd, "password"), confirmPassword: teks(fd, "confirmPassword") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const ok = await resetPassword(token, parsed.data.password);
  if (!ok) return { error: "Tautan ini sudah tidak berlaku. Minta tautan baru dari halaman Lupa password." };
  redirect("/masuk?reset=berhasil");
}
