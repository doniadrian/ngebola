// Logika murni reputasi club (PRD 7): Elo, peringkat leaderboard, keandalan, level. Tanpa akses DB.
import type { Level } from "@/db/enums";

export type ParamRating = { awal: number; kBaru: number; kLama: number; batasBaru: number };
export const PARAM_RATING: ParamRating = { awal: 1200, kBaru: 40, kLama: 24, batasBaru: 10 };

/** Pengali selisih gol G: 1,0 (0–1), 1,25 (2), 1,5 (≥ 3). */
export const pengaliSelisih = (selisih: number) => (Math.abs(selisih) >= 3 ? 1.5 : Math.abs(selisih) === 2 ? 1.25 : 1);

/** E_A = 1 / (1 + 10^((R_B − R_A)/400)) */
export const ekspektasi = (ra: number, rb: number) => 1 / (1 + 10 ** ((rb - ra) / 400));

/**
 * Rating baru kedua club setelah satu hasil. `mainA/mainB` = jumlah hasil terkonfirmasi sebelumnya pada format ini
 * (menentukan K: 40 untuk 10 match pertama, lalu 24).
 */
export function hitungElo(
  a: { rating: number; main: number },
  b: { rating: number; main: number },
  skorA: number,
  skorB: number,
  p: ParamRating = PARAM_RATING,
) {
  const sA = skorA > skorB ? 1 : skorA === skorB ? 0.5 : 0;
  const g = pengaliSelisih(skorA - skorB);
  const k = (main: number) => (main < p.batasBaru ? p.kBaru : p.kLama);
  const eA = ekspektasi(a.rating, b.rating);
  const baruA = Math.round(a.rating + k(a.main) * g * (sA - eA));
  const baruB = Math.round(b.rating + k(b.main) * g * (1 - sA - (1 - eA)));
  return { a: baruA, b: baruB };
}

export const MIN_PERINGKAT_RESMI = 5;

export type BarisRating = { clubId: string; rating: number; main: number };

/**
 * Leaderboard (PRD 1): nomor resmi hanya untuk ≥ 5 hasil; rating sama berbagi peringkat (1, 2, 2, 4).
 * 1–4 hasil = rating sementara tanpa nomor. Tanpa hasil tidak tampil.
 */
export function susunPeringkat<T extends BarisRating>(baris: T[]) {
  const urut = [...baris].filter((b) => b.main > 0).sort((x, y) => y.rating - x.rating || y.main - x.main);
  const resmi = urut.filter((b) => b.main >= MIN_PERINGKAT_RESMI);
  const sementara = urut.filter((b) => b.main < MIN_PERINGKAT_RESMI);
  let peringkat = 0;
  const berNomor = resmi.map((b, i) => {
    if (i === 0 || b.rating !== resmi[i - 1].rating) peringkat = i + 1;
    return { ...b, peringkat };
  });
  return { resmi: berNomor, sementara };
}

/** Koreksi level dari rating setelah 5 hasil (PRD C-05; ambang PLAN.md butir 14). */
export function levelDariRating(rating: number): Level {
  return rating < 1150 ? "pemula" : rating <= 1300 ? "menengah" : "mahir";
}

// ── Keandalan (PRD 7.2) ─────────────────────────────────────────────────────

/** Satu match terjadwal (pernah terkonfirmasi) dari sudut pandang satu club. */
export type CatatanJadwal = { waktu: Date; gagal: boolean };

export const MIN_KEANDALAN = 5;
export const JENDELA_KEANDALAN = 20;
export const AMBANG_PERINGATAN = 60;

/** Persentase dari 20 match terjadwal terakhir yang dijalani tanpa batal sepihak < 24 jam atau tidak hadir. */
export function skorKeandalan(catatan: CatatanJadwal[]): { baru: true } | { baru: false; persen: number; peringatan: boolean } {
  if (catatan.length < MIN_KEANDALAN) return { baru: true };
  const terakhir = [...catatan].sort((a, b) => b.waktu.getTime() - a.waktu.getTime()).slice(0, JENDELA_KEANDALAN);
  const persen = Math.round((100 * terakhir.filter((c) => !c.gagal).length) / terakhir.length);
  return { baru: false, persen, peringatan: persen < AMBANG_PERINGATAN };
}
