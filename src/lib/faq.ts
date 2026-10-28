// FAQ beranda. Satu sumber untuk tampilan akordeon dan JSON-LD FAQPage (SEO). Jawaban hanya memuat hal yang benar-benar ada di app.
import { PEMAIN_AKTIF } from "./fitur"

const SEMUA: { q: string; a: string; pemain?: true }[] = [
  {
    q: "Apa itu Ngebola?",
    a: "Ngebola adalah platform sparring antar club fun football di Pekanbaru. Club bisa mencari lawan, menyepakati jadwal dan lapangan, mencatat skor, lalu membangun rating dan reputasi dari hasil yang dikonfirmasi kedua pihak.",
  },
  {
    q: "Apakah Ngebola gratis?",
    a: "Ya, gratis. Ngebola tidak memungut biaya dan tidak mengurus pembayaran atau pemesanan lapangan. Biaya sewa lapangan disepakati langsung antar club; aplikasi hanya mencatat total biayanya di detail match.",
  },
  {
    q: "Format permainan apa saja yang didukung?",
    a: "Football 11v11 dan mini soccer. Rating dan leaderboard dihitung terpisah untuk tiap format karena kekuatan sebuah club bisa berbeda di tiap format.",
  },
  {
    q: "Bagaimana rating club dihitung?",
    a: "Memakai sistem Elo sederhana per format, mulai dari 1200. Hanya hasil yang dikonfirmasi atau diputus Admin platform yang dihitung. Nomor peringkat resmi diberikan setelah minimal 5 hasil pada format yang sama; sebelum itu club tampil dengan rating sementara.",
  },
  {
    q: "Bagaimana jika lawan tidak datang?",
    a: "Setelah toleransi 20 menit dari jadwal kick-off, club yang sudah check-in menang WO 3-0. Hasil WO tidak mengubah rating, tetapi menurunkan skor keandalan club yang tidak hadir. Jika kedua club tidak hadir, match dibatalkan dan keduanya mendapat penalti keandalan.",
  },
  {
    q: "Bagaimana jika skor yang dicatat berbeda?",
    a: "Satu club mencatat skor, lawan punya 48 jam untuk menyetujui atau menyanggah. Jika disanggah, kedua club melampirkan bukti berupa tautan dan catatan, lalu Admin platform memutus dalam 3 hari kerja. Keputusan dan alasannya tercatat di log audit.",
  },
  {
    q: "Apakah pemain perlu punya akun?",
    a: "Pemain tidak wajib, tetapi dengan akun pemain bisa bergabung ke skuad lewat kode atau undangan, melihat jadwal, dan mengonfirmasi ikut atau tidak ikut sehingga admin tahu jumlah pemain yang benar-benar siap.",
    pemain: true,
  },
  {
    q: "Apakah data pemain tampil di halaman publik?",
    a: "Tidak. Halaman publik hanya menampilkan club: profil, statistik, match terbuka, dan leaderboard. Profil pemain hanya terlihat oleh pemain itu sendiri, admin club-nya, sesama anggota skuad, dan Admin platform.",
    pemain: true,
  },
  {
    q: "Siapa yang bisa mendaftar dan bagaimana club diverifikasi?",
    a: "Pengguna berusia minimal 17 tahun. Satu akun Admin club mengelola satu club. Club baru diverifikasi Admin platform sebelum bisa membuat match atau menerima tantangan, biasanya dalam 1 hari kerja.",
  },
];

export const FAQ = SEMUA.filter((f) => PEMAIN_AKTIF || !f.pemain)
