import { describe, expect, it } from "vitest";
import { ekspektasi, hitungElo, levelDariRating, pengaliSelisih, skorKeandalan, susunPeringkat } from "@/server/domain/reputasi";

describe("Elo (PRD 7.1)", () => {
  it("rating sama: menang selisih 1 dengan K 40 → +20 / −20", () => {
    expect(ekspektasi(1200, 1200)).toBe(0.5);
    expect(hitungElo({ rating: 1200, main: 0 }, { rating: 1200, main: 0 }, 1, 0)).toEqual({ a: 1220, b: 1180 });
  });

  it("pengali selisih gol dibatasi 1,5", () => {
    expect([0, 1, 2, 3, 7].map(pengaliSelisih)).toEqual([1, 1, 1.25, 1.5, 1.5]);
    expect(hitungElo({ rating: 1200, main: 0 }, { rating: 1200, main: 0 }, 7, 0)).toEqual({ a: 1230, b: 1170 });
  });

  it("K turun ke 24 setelah 10 match", () => {
    expect(hitungElo({ rating: 1200, main: 10 }, { rating: 1200, main: 0 }, 1, 0)).toEqual({ a: 1212, b: 1180 });
  });

  it("seri antara rating berbeda menguntungkan yang lebih lemah", () => {
    const r = hitungElo({ rating: 1300, main: 0 }, { rating: 1100, main: 0 }, 2, 2);
    expect(r.a).toBeLessThan(1300);
    expect(r.b).toBeGreaterThan(1100);
  });
});

describe("leaderboard", () => {
  it("nomor resmi hanya untuk ≥ 5 hasil, rating sama berbagi peringkat, tanpa hasil tidak tampil", () => {
    const { resmi, sementara } = susunPeringkat([
      { clubId: "a", rating: 1250, main: 6 },
      { clubId: "b", rating: 1230, main: 5 },
      { clubId: "c", rating: 1230, main: 7 },
      { clubId: "d", rating: 1200, main: 5 },
      { clubId: "e", rating: 1400, main: 3 },
      { clubId: "f", rating: 1200, main: 0 },
    ]);
    expect(resmi.map((r) => [r.clubId, r.peringkat])).toEqual([["a", 1], ["c", 2], ["b", 2], ["d", 4]]);
    expect(sementara.map((r) => r.clubId)).toEqual(["e"]);
  });
});

describe("keandalan (PRD 7.2)", () => {
  const hari = (n: number) => new Date(Date.UTC(2026, 0, n));
  it("'Baru' sampai 5 match terjadwal", () => {
    expect(skorKeandalan([1, 2, 3, 4].map((n) => ({ waktu: hari(n), gagal: false })))).toEqual({ baru: true });
  });
  it("hanya 20 match terakhir yang dihitung, peringatan di bawah 60%", () => {
    const lama = Array.from({ length: 10 }, (_, i) => ({ waktu: hari(i + 1), gagal: true }));
    const baru = Array.from({ length: 20 }, (_, i) => ({ waktu: hari(i + 11), gagal: i < 2 }));
    expect(skorKeandalan([...lama, ...baru])).toEqual({ baru: false, persen: 90, peringatan: false });
    expect(skorKeandalan(Array.from({ length: 5 }, (_, i) => ({ waktu: hari(i + 1), gagal: i < 3 })))).toEqual({ baru: false, persen: 40, peringatan: true });
  });
});

describe("level dari rating", () => {
  it("< 1150 Pemula, 1150–1300 Menengah, > 1300 Mahir", () => {
    expect([1149, 1150, 1300, 1301].map(levelDariRating)).toEqual(["pemula", "menengah", "menengah", "mahir"]);
  });
});
