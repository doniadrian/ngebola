import { z } from "zod";
import { AREA, KAKI, LEVEL, POSISI } from "@/db/enums";
import { umur } from "./waktu";
import { WARNA_CLUB } from "./warna";

export const UMUR_MINIMAL = 17;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email wajib diisi.")
  .max(254, "Email terlalu panjang.")
  .pipe(z.email("Format email belum benar."));

export const passwordBaruSchema = z
  .string()
  .min(10, "Password minimal 10 karakter.")
  .max(128, "Password maksimal 128 karakter.");

export const tanggalLahirSchema = (now: Date) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Isi tanggal lahir.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Tanggal lahir tidak valid.")
    .refine((v) => umur(v, now) >= UMUR_MINIMAL, `Minimal berusia ${UMUR_MINIMAL} tahun.`)
    .refine((v) => umur(v, now) <= 100, "Tanggal lahir tidak valid.");

export const daftarSchema = (now: Date) =>
  z
    .object({
      role: z.enum(["club_admin", "player"], "Pilih peran: Admin club atau Pemain."),
      name: z.string().trim().min(2, "Nama minimal 2 huruf.").max(80, "Nama maksimal 80 huruf."),
      email: emailSchema,
      birthDate: tanggalLahirSchema(now),
      password: passwordBaruSchema,
      confirmPassword: z.string(),
      // Persetujuan eksplisit (UU PDP): kotak centang wajib, tidak boleh tercentang otomatis.
      setuju: z.literal("on", "Centang persetujuan untuk melanjutkan."),
    })
    .refine((v) => v.password === v.confirmPassword, {
      path: ["confirmPassword"],
      message: "Konfirmasi password belum sama.",
    });

export const masukSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi.").max(128, "Password maksimal 128 karakter."),
});

export const resetSchema = z
  .object({ password: passwordBaruSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password belum sama.",
  });

const opsional = <T extends z.ZodType>(s: T) => z.preprocess((v) => (v === "" || v == null ? undefined : v), s.optional());
const warna = z.enum(WARNA_CLUB.map((w) => w.hex) as [string, ...string[]], "Pilih warna dari daftar.");

export const clubSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama club minimal 3 huruf.")
    .max(60, "Nama club maksimal 60 huruf.")
    .regex(/[a-zA-Z]/, "Nama club harus mengandung huruf."),
  area: z.enum(AREA, "Pilih area basis club."),
  level: z.enum(LEVEL, "Pilih level club."),
  foundedYear: opsional(z.coerce.number().int("Tahun tidak valid.").min(1950, "Tahun tidak valid.").max(new Date().getFullYear(), "Tahun tidak boleh di masa depan.")),
  description: opsional(z.string().trim().max(500, "Deskripsi maksimal 500 karakter.")),
  contactPhone: z
    .string()
    .transform((v) => v.replace(/[\s.-]/g, ""))
    .pipe(z.string().regex(/^(\+62|62|0)8\d{7,12}$/, "Nomor HP belum benar, mis. 0812 3456 7890.")),
  crestColor: warna,
  jerseyHome: warna,
  jerseyAway: warna,
});
export type ClubInput = z.infer<typeof clubSchema>;

export const profilPemainSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 huruf.").max(80, "Nama maksimal 80 huruf."),
  position: opsional(z.enum(POSISI, "Pilih posisi.")),
  dominantFoot: opsional(z.enum(KAKI, "Pilih kaki dominan.")),
  area: opsional(z.enum(AREA, "Pilih area.")),
});

export const alasanSchema = (min = 10) => z.string().trim().min(min, `Tulis alasan minimal ${min} karakter.`).max(500, "Alasan maksimal 500 karakter.");

/** Ubah error zod menjadi { field: pesan pertama }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    out[key] ??= issue.message;
  }
  return out;
}
