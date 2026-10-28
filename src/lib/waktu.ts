// Semua waktu disimpan UTC dan ditampilkan dalam WIB (Asia/Jakarta, UTC+7 tanpa DST).
export const ZONA = "Asia/Jakarta";
const WIB_MS = 7 * 60 * 60 * 1000;

const fmtTanggalISO = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

/** Tanggal kalender WIB dalam bentuk YYYY-MM-DD. */
export const tanggalWIB = (d: Date) => fmtTanggalISO.format(d);

/** Umur penuh (tahun) pada tanggal WIB `now` untuk tanggal lahir YYYY-MM-DD. */
export function umur(tanggalLahir: string, now: Date): number {
  const [ly, lm, ld] = tanggalLahir.split("-").map(Number);
  const [y, m, d] = tanggalWIB(now).split("-").map(Number);
  return y - ly - (m < lm || (m === lm && d < ld) ? 1 : 0);
}

/** Gabungkan tanggal (YYYY-MM-DD) dan jam (HH:mm) WIB menjadi Date UTC. */
export function dariWIB(tanggal: string, jam = "00:00"): Date {
  const [y, m, d] = tanggal.split("-").map(Number);
  const [hh, mm] = jam.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - WIB_MS);
}

const fmtTanggal = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, weekday: "short", day: "numeric", month: "short" });
const fmtTanggalPanjang = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtJam = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false });

/** "Sab, 31 Okt" */
export const formatTanggal = (d: Date) => fmtTanggal.format(d).replace(/\./g, "");
/** "Sab, 31 Okt 2026" */
export const formatTanggalPanjang = (d: Date) => fmtTanggalPanjang.format(d).replace(/\./g, "");
/** "19.00" */
export const formatJam = (d: Date) => fmtJam.format(d).replace(":", ".");
/** "Sab, 31 Okt · 19.00" */
export const formatJadwal = (d: Date) => `${formatTanggal(d)} · ${formatJam(d)}`;

const fmtRupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
/** "Rp 450.000" */
export const formatRupiah = (n: number) => fmtRupiah.format(n).replace(/ /g, " ");

export const MENIT = 60_000;
export const JAM = 60 * MENIT;
export const HARI = 24 * JAM;
