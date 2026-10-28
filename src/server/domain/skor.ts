// Logika murni pencatat skor (PRD D-02, D-03, W-04). Catatan skor hanya ditambah, tidak dihapus.

export type EventSkor = "mulai" | "skor" | "jeda" | "akhir_babak" | "selesai";
export type CatatanSkor = { half: number; creatorScore: number; opponentScore: number; event: EventSkor; recordedAt: Date; conflict?: boolean };
export type Fase = "belum" | "babak1" | "jeda" | "babak2" | "selesai";
export type KeadaanSkor = { fase: Fase; babak: 1 | 2; skor: [number, number]; skorBabak1: [number, number] | null };

/** Keadaan pertandingan dari catatan yang sah (bukan konflik), urut jam perangkat. */
export function keadaanSkor(catatan: CatatanSkor[]): KeadaanSkor {
  let k: KeadaanSkor = { fase: "belum", babak: 1, skor: [0, 0], skorBabak1: null };
  for (const c of [...catatan].filter((c) => !c.conflict).sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())) {
    k = langkah(k, c) ?? k;
  }
  return k;
}

/** Terapkan satu catatan; null bila tidak sah pada keadaan sekarang (→ ditandai konflik). */
export function langkah(k: KeadaanSkor, c: CatatanSkor): KeadaanSkor | null {
  const skor: [number, number] = [c.creatorScore, c.opponentScore];
  if (c.creatorScore < 0 || c.opponentScore < 0 || c.creatorScore > 99 || c.opponentScore > 99) return null;
  switch (c.event) {
    case "mulai":
      if (k.fase === "belum" && c.half === 1) return { ...k, fase: "babak1", babak: 1, skor: [0, 0] };
      if (k.fase === "jeda" && c.half === 2) return { ...k, fase: "babak2", babak: 2 };
      return null;
    case "skor":
      if ((k.fase === "babak1" && c.half === 1) || (k.fase === "babak2" && c.half === 2)) return { ...k, skor };
      return null;
    case "jeda":
    case "akhir_babak":
      if (k.fase === "babak1" && c.half === 1) return { ...k, fase: "jeda", skor, skorBabak1: skor };
      return null;
    case "selesai":
      if (k.fase === "babak2" && c.half === 2) return { ...k, fase: "selesai", skor };
      return null;
  }
}

/**
 * Sinkron catatan baru terhadap yang sudah ada: catatan yang lebih tua dari catatan sah terakhir, atau yang tidak sah
 * pada keadaannya, ditandai konflik untuk ditinjau manual (tidak ada data yang dibuang).
 */
export function tandaiKonflik<T extends CatatanSkor>(lama: CatatanSkor[], baru: T[]): (T & { conflict: boolean })[] {
  const sah = lama.filter((c) => !c.conflict).sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  let k = keadaanSkor(sah);
  let terakhir = sah.at(-1)?.recordedAt.getTime() ?? 0;
  return [...baru]
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
    .map((c) => {
      const next = c.recordedAt.getTime() >= terakhir ? langkah(k, c) : null;
      if (!next) return { ...c, conflict: true };
      k = next;
      terakhir = c.recordedAt.getTime();
      return { ...c, conflict: false };
    });
}
