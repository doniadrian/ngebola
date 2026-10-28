import { z } from "zod";
import { AREA, FORMAT, LEVEL } from "@/db/enums";
import { teks } from "./form-state";
import { dariWIB, HARI, JAM } from "./waktu";

export const MAKS_OPSI = 3;
/** Opsi jadwal minimal 25 jam lagi: tenggat respons = 24 jam sebelum jadwal (PRD 6). */
export const JEDA_MINIMAL_MS = 25 * JAM;
export const JANGKAUAN_MAKS_MS = 90 * HARI;

export type Lapangan = { venueId: string | null; manualName: string | null; manualAddress: string | null };
export type InputUsulan = { opsi: Date[]; lapangan: Lapangan; feeTotal: number | null; pesan: string | null };
type Hasil<T> = { ok: true; data: T } | { ok: false; fieldErrors: Record<string, string> };

/** Jam pilihan (WIB), tiap 30 menit 06.00–23.00. */
export const PILIHAN_JAM = Array.from({ length: 35 }, (_, i) => {
  const m = 360 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 ? "30" : "00"}`;
});

/** Opsi jadwal dari field tanggal_i (YYYY-MM-DD) + jam_i (HH:mm), i = 0..2. */
export function bacaOpsi(fd: FormData, now: Date, jedaMinimal = JEDA_MINIMAL_MS): { opsi: Date[]; error?: string } {
  const opsi: Date[] = [];
  for (let i = 0; i < MAKS_OPSI; i++) {
    const tanggal = teks(fd, `tanggal_${i}`);
    const jam = teks(fd, `jam_${i}`);
    if (!tanggal && !jam) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || !PILIHAN_JAM.includes(jam)) return { opsi, error: `Lengkapi tanggal dan jam opsi ${i + 1}.` };
    opsi.push(dariWIB(tanggal, jam));
  }
  if (!opsi.length) return { opsi, error: "Isi minimal satu opsi jadwal." };
  if (opsi.some((o) => o.getTime() < now.getTime() + jedaMinimal)) {
    return { opsi, error: jedaMinimal === JEDA_MINIMAL_MS ? "Jadwal minimal 25 jam dari sekarang, supaya lawan sempat merespons." : `Jadwal minimal ${Math.round(jedaMinimal / JAM)} jam dari sekarang.` };
  }
  if (opsi.some((o) => o.getTime() > now.getTime() + JANGKAUAN_MAKS_MS)) return { opsi, error: "Jadwal maksimal 90 hari ke depan." };
  if (new Set(opsi.map((o) => o.getTime())).size !== opsi.length) return { opsi, error: "Opsi jadwal tidak boleh sama." };
  return { opsi: opsi.sort((a, b) => a.getTime() - b.getTime()) };
}

export function bacaLapangan(fd: FormData, wajib: boolean): { lapangan: Lapangan; error?: string } {
  const pilihan = teks(fd, "venueId");
  if (pilihan === "manual") {
    const manualName = teks(fd, "manualName").trim().slice(0, 100);
    const manualAddress = teks(fd, "manualAddress").trim().slice(0, 200);
    if (manualName.length < 3 || manualAddress.length < 5) return { lapangan: { venueId: null, manualName, manualAddress }, error: "Isi nama dan alamat lapangan." };
    return { lapangan: { venueId: null, manualName, manualAddress } };
  }
  if (!pilihan) return { lapangan: { venueId: null, manualName: null, manualAddress: null }, error: wajib ? "Pilih lapangan." : undefined };
  return { lapangan: { venueId: pilihan, manualName: null, manualAddress: null } };
}

/** "450.000" / "Rp 450000" → 450000. Kosong → null. */
export function bacaRupiah(v: string): number | null | "salah" {
  const bersih = v.replace(/[^\d]/g, "");
  if (!v.trim()) return null;
  const n = Number(bersih);
  return bersih && Number.isSafeInteger(n) && n <= 100_000_000 ? n : "salah";
}

/** Usulan (opsi + lapangan + biaya + pesan) untuk match baru maupun tawar balik. */
export function bacaUsulan(fd: FormData, now: Date, lapanganWajib = false): Hasil<InputUsulan> {
  const fieldErrors: Record<string, string> = {};
  const { opsi, error: eOpsi } = bacaOpsi(fd, now);
  if (eOpsi) fieldErrors.opsi = eOpsi;
  const { lapangan, error: eLap } = bacaLapangan(fd, lapanganWajib);
  if (eLap) fieldErrors.venueId = eLap;
  const fee = bacaRupiah(teks(fd, "feeTotal"));
  if (fee === "salah") fieldErrors.feeTotal = "Biaya tidak valid (maks Rp 100.000.000).";
  const pesan = teks(fd, "pesan").trim().slice(0, 300) || null;
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  return { ok: true, data: { opsi, lapangan, feeTotal: fee === "salah" ? null : fee, pesan } };
}

export const matchBaruSchema = z.object({
  format: z.enum(FORMAT, "Pilih format."),
  area: z.preprocess((v) => v || undefined, z.enum(AREA).optional()),
  level: z.preprocess((v) => v || undefined, z.enum(LEVEL).optional()),
});
