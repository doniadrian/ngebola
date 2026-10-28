import { describe, expect, it } from "vitest";
import { keadaanSkor, tandaiKonflik, type CatatanSkor } from "@/server/domain/skor";

const t = (menit: number) => new Date(Date.UTC(2026, 10, 1, 12, menit));
const c = (menit: number, half: number, a: number, b: number, event: CatatanSkor["event"]): CatatanSkor => ({ half, creatorScore: a, opponentScore: b, event, recordedAt: t(menit) });

describe("pencatat skor", () => {
  it("menurunkan babak, jeda, dan skor akhir dari catatan", () => {
    const k = keadaanSkor([c(0, 1, 0, 0, "mulai"), c(10, 1, 1, 0, "skor"), c(40, 1, 1, 0, "akhir_babak"), c(55, 2, 1, 0, "mulai"), c(70, 2, 1, 1, "skor"), c(90, 2, 2, 1, "selesai")]);
    expect(k).toEqual({ fase: "selesai", babak: 2, skor: [2, 1], skorBabak1: [1, 0] });
  });

  it("urutan masuk tidak penting, yang dipakai jam perangkat", () => {
    const k = keadaanSkor([c(10, 1, 1, 0, "skor"), c(0, 1, 0, 0, "mulai"), c(20, 1, 2, 0, "skor")]);
    expect(k).toMatchObject({ fase: "babak1", skor: [2, 0] });
  });

  it("catatan offline yang lebih tua dari catatan sah terakhir ditandai konflik, tidak dibuang", () => {
    const lama = [c(0, 1, 0, 0, "mulai"), c(30, 1, 2, 0, "skor")];
    const hasil = tandaiKonflik(lama, [c(20, 1, 1, 1, "skor"), c(35, 1, 3, 0, "skor")]);
    expect(hasil.map((h) => h.conflict)).toEqual([true, false]);
    expect(keadaanSkor([...lama, ...hasil]).skor).toEqual([3, 0]);
  });

  it("event tidak sah pada keadaan sekarang ditandai konflik", () => {
    expect(tandaiKonflik([], [c(0, 2, 1, 0, "skor")])[0].conflict).toBe(true);
    expect(tandaiKonflik([c(0, 1, 0, 0, "mulai")], [c(5, 1, 0, 0, "selesai")])[0].conflict).toBe(true);
  });
});
