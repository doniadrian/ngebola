/** Hasil server action untuk form (useActionState). */
export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export const teks = (fd: FormData, key: string) => String(fd.get(key) ?? "");

/** Nilai form (tanpa file & password) untuk mengisi ulang form setelah error. */
export const nilaiForm = (fd: FormData, kecuali: string[] = []) =>
  Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$") && !kecuali.includes(k)) as [string, string][]);
