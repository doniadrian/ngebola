# Ngebola — aturan tetap proyek

Web app sparring antar club fun football, fokus awal Pekanbaru.
Sumber kebenaran: [PRD.md](PRD.md) untuk fungsi, [DESIGN.md](DESIGN.md) + [referensi/](referensi/) untuk tampilan.
Rencana kerja: [docs/PLAN.md](docs/PLAN.md). Status aktual: [STATUS.md](STATUS.md).

## Stack (jangan diganti)

- Next.js App Router + TypeScript + Tailwind + shadcn/ui yang dikustomisasi sesuai DESIGN.md.
- Ikon `@phosphor-icons/react`, weight **bold** (Fill untuk tab aktif, Duotone untuk ilustrasi kecil).
- Font Plus Jakarta Sans lewat `next/font` (500/600/700/800).
- SQLite + Drizzle ORM. Skema dan query harus mudah dipindah ke Supabase/Postgres: tanpa fitur khusus SQLite
  (tanpa `rowid`, tanpa tipe dinamis, tanpa fungsi SQL khusus SQLite; id `text` UUID, waktu sebagai timestamp Drizzle,
  enum sebagai `text` dengan daftar nilai di TypeScript).
- Resend untuk email. Mode demo di development: tautan/isi email dicetak di terminal, tidak dikirim.
- Web Push standar (VAPID), tanpa layanan notifikasi berbayar.

## Aturan produk

- Bahasa UI Indonesia, zona waktu WIB (`Asia/Jakarta`), mata uang Rupiah.
- Mobile-first: cek setiap layar di lebar 390 px dan desktop. Target sentuh ≥ 44 px, safe area, teks isian ≥ 16 px.
- Tiga peran: **Admin club**, **Admin platform**, **Pemain** (akses terbatas, PRD 4.4). Pengunjung tanpa akun hanya
  bisa membuka beranda, `/jelajahi`, `/leaderboard`.
- Hak akses **wajib diperiksa di server** (server action / route handler / query), bukan hanya disembunyikan di UI.
- Aturan PRD (otorisasi server, verifikasi club, persetujuan perubahan jadwal, konfirmasi hasil) tidak boleh
  dilonggarkan demi tampilan.
- Profil pemain tidak pernah tampil di halaman publik.

## Di luar cakupan — jangan dibangun

Iuran, kas, pembayaran, booking, statistik karier pemain, lineup, pencetak gol, live score, WhatsApp otomatis,
login Google/OTP. Komponen iuran di DESIGN.md/referensi (stempel LUNAS, badge "Dicek Admin", kartu iuran, tab Iuran,
"Rp …/orang", "x dari y lunas") tidak dipakai.

## Tampilan

- Kalau PRD dan DESIGN bertentangan: PRD menang untuk fungsi, DESIGN menang untuk tampilan. Catat pertentangan di STATUS.md.
- Komponen yang tidak ada di referensi dibuat dengan aturan DESIGN.md: tepi 2px tinted, bayangan keras tanpa blur
  (`0 4px 0`), efek tekan `translateY(4px)` + bayangan hilang, radius dari token. Jangan menambah gaya baru.
- Satu tombol Utama per layar/kartu. Kolom isian tanpa bayangan keras.
- Logo dan maskot dari `assets/` dipakai apa adanya. Data demo memakai lambang club fiksi, bukan logo club nyata.
- Hormati `prefers-reduced-motion`; status tidak hanya dibedakan warna.

## Cara kerja per fase

- Kerjakan hanya fase yang diminta (lihat docs/PLAN.md).
- Setiap akhir fase: jalankan app, cek di browser (390 px + desktop), jalankan tes, perbarui STATUS.md, lalu
  **BERHENTI dan laporkan**. Jangan lanjut ke fase berikutnya sebelum diminta.
- Dokumen yang dijaga di root: CODEBASE.md, STATUS.md, DATABASE.md, DEVELOPMENT.md.
