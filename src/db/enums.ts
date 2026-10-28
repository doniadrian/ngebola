// Nilai status disimpan sebagai text (portabel ke Postgres); daftar dan label Indonesia hanya di sini.

export const PERAN = ["club_admin", "platform_admin", "player"] as const;
export type Peran = (typeof PERAN)[number];
export const LABEL_PERAN: Record<Peran, string> = {
  club_admin: "Admin club",
  platform_admin: "Admin platform",
  player: "Pemain",
};

export const STATUS_AKUN = ["aktif", "nonaktif", "ditangguhkan"] as const;
export type StatusAkun = (typeof STATUS_AKUN)[number];

export const FORMAT = ["football", "mini"] as const;
export type Format = (typeof FORMAT)[number];
export const LABEL_FORMAT: Record<Format, string> = { football: "Football 11v11", mini: "Mini soccer" };
export const MIN_PEMAIN: Record<Format, number> = { football: 8, mini: 5 };

export const LEVEL = ["pemula", "menengah", "mahir"] as const;
export type Level = (typeof LEVEL)[number];
export const LABEL_LEVEL: Record<Level, string> = { pemula: "Pemula", menengah: "Menengah", mahir: "Mahir" };

// 15 kecamatan Pekanbaru (PLAN.md pertanyaan 4).
export const AREA = [
  "Binawidya", "Bukit Raya", "Kulim", "Lima Puluh", "Marpoyan Damai", "Payung Sekaki", "Pekanbaru Kota",
  "Rumbai", "Rumbai Barat", "Rumbai Timur", "Sail", "Senapelan", "Sukajadi", "Tenayan Raya", "Tuah Madani",
] as const;
export type Area = (typeof AREA)[number];

export const STATUS_REGISTRASI = ["diajukan", "disetujui", "ditolak"] as const;
export const POSISI = ["kiper", "bek", "gelandang", "penyerang"] as const;
export const LABEL_POSISI: Record<(typeof POSISI)[number], string> = {
  kiper: "Kiper", bek: "Bek", gelandang: "Gelandang", penyerang: "Penyerang",
};
export const KAKI = ["kanan", "kiri", "keduanya"] as const;

export const STATUS_SKUAD = ["diundang", "diajukan", "aktif", "ditolak", "keluar"] as const;
export const VIA_SKUAD = ["tautan", "kode"] as const;
export const PENGAKHIR_SKUAD = ["pemain", "admin"] as const;

export const PERMUKAAN = ["alami", "sintetis"] as const;
/** Indeks = Date.getDay() (0 = Minggu), sama dengan venue_slots.day_of_week. */
export const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

export const TIPE_MATCH = ["terbuka", "tantangan"] as const;
export const STATUS_MATCH = [
  "draf", "terbuka", "ditantang", "dinegosiasi", "terkonfirmasi", "ditunda", "berlangsung",
  "menunggu_hasil", "selesai", "sengketa", "ditolak", "kedaluwarsa", "dibatalkan", "wo",
] as const;
export type StatusMatch = (typeof STATUS_MATCH)[number];
export const LABEL_STATUS_MATCH: Record<StatusMatch, string> = {
  draf: "Draf",
  terbuka: "Terbuka",
  ditantang: "Menunggu",
  dinegosiasi: "Ditawar",
  terkonfirmasi: "Diterima",
  ditunda: "Ditunda",
  berlangsung: "Berlangsung",
  menunggu_hasil: "Cek hasil",
  selesai: "Selesai",
  sengketa: "Sengketa",
  ditolak: "Ditolak",
  kedaluwarsa: "Kedaluwarsa",
  dibatalkan: "Dibatalkan",
  wo: "WO",
};

// "tidak_hadir" = kedua club tidak check-in (PRD 10.1), diisi sistem, bukan pilihan pengguna.
export const ALASAN_BATAL = ["cuaca", "lapangan", "pemain_kurang", "bentrok_jadwal", "lainnya", "tidak_hadir"] as const;
export const LABEL_ALASAN_BATAL: Record<(typeof ALASAN_BATAL)[number], string> = {
  cuaca: "Cuaca buruk",
  lapangan: "Lapangan tidak bisa dipakai",
  pemain_kurang: "Pemain kurang",
  bentrok_jadwal: "Bentrok jadwal",
  lainnya: "Alasan lain",
  tidak_hadir: "Kedua club tidak hadir",
};
export const STATUS_USULAN = ["menunggu", "dipilih", "ditolak", "kedaluwarsa"] as const;
export const JENIS_PERUBAHAN = ["jadwal", "lapangan", "tunda"] as const;
export const STATUS_PERUBAHAN = ["menunggu", "disetujui", "ditolak"] as const;
export const JAWABAN_RSVP = ["ikut", "tidak", "ragu"] as const;
export const EVENT_SKOR = ["mulai", "skor", "jeda", "akhir_babak", "selesai"] as const;
export const RESPON_HASIL = ["setuju", "sanggah"] as const;
export const KEPUTUSAN_SENGKETA = ["pengusul", "penyanggah", "koreksi", "batal"] as const;

export const JENIS_PESAN = ["manusia", "sistem"] as const;
export const TARGET_LAPORAN = ["pesan", "ulasan", "club"] as const;
export const STATUS_LAPORAN = ["terbuka", "ditindak", "ditolak"] as const;
export const KANAL = ["push", "email"] as const;
export const STATUS_KIRIM = ["menunggu", "terkirim", "gagal"] as const;
export const JENIS_PENGINGAT = ["h3", "h1", "2jam", "hasil1", "hasil2"] as const;
export const JENIS_FLAG = ["pasangan_sering", "lonjakan_rating", "akun_ganda", "ulasan_pola"] as const;
export const STATUS_FLAG = ["terbuka", "ditinjau", "diabaikan"] as const;
