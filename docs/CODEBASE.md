# Peta codebase

Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui (Radix) yang di-restyle sesuai [DESIGN.md](DESIGN.md).
Rencana lengkap: [PLAN.md](PLAN.md). Aturan tetap: [CLAUDE.md](../CLAUDE.md).

## Struktur

```
src/
  app/
    (publik)/            /, /jelajahi, /leaderboard — pengunjung tanpa akun
    (auth)/              /masuk, /daftar, /lupa-password, /reset-password/[token]
    (app)/club/…         area Admin club     ┐ layout & setiap page memanggil requireRole(...)
    (app)/pemain/…       area Pemain         │
    (app)/platform/…     area Admin platform ┘
    dev/komponen/        galeri komponen (404 di production)
    layout.tsx           font Plus Jakarta Sans, lang="id", Toaster
    penyedia.tsx         IconContext Phosphor (bold) + Toaster
    globals.css          token DESIGN.md sebagai @theme Tailwind
  components/
    ui/                  komponen shadcn yang sudah di-restyle (button, input, select, …)
    ngebola/             komponen khas: lambang, badge-status, avatar-pemain, navigasi, kerangka-*, field, …
  db/                    schema.ts, enums.ts, index.ts (koneksi + migrateDb)
  lib/                   utils (cn), validasi (zod), waktu (WIB, Rupiah), slug, warna
  server/
    auth/                crypto (scrypt, token), service (akun, sesi, reset, batas laju), session (cookie)
    authz.ts             requireUser / requireRole / redirectIfSignedIn, BERANDA_PERAN
    akses.ts             siapa boleh melihat profil/foto pemain
    actions/             server actions per domain ("use server"): auth, club, skuad, pemain, match, hari-h, platform, notifikasi
    domain/              logika murni & dites: reputasi (Elo, peringkat, keandalan, level), skor (keadaan & konflik pencatat)
    club.ts skuad.ts     registrasi/verifikasi club, galeri; undangan, kode, keanggotaan
    match.ts             siklus hidup match: buat, terima, tolak, tawar balik, batal, perubahan/penundaan
    kesiapan.ts          RSVP pemain & jumlah pemain siap
    chat.ts              chat match, filter kata kasar, laporan, blokir club
    hari-h.ts            check-in, mulai, sinkron skor, konfirmasi hasil, sengketa, penilaian, WO
    rating.ts            terapkan Elo + anti-manipulasi saat match Selesai
    tenggat.ts pengingat.ts berkala.ts   pekerjaan berkala (dipanggil instrumentation.ts tiap 60 dtk atau POST /api/cron)
    platform.ts          tindakan Admin platform (tangguhkan, moderasi, lapangan, pengaturan) — semua diaudit
    notify/              beritahu() = dalam aplikasi + Web Push (push.ts) + email (email.ts)
    queries/             query baca untuk halaman
  instrumentation.ts     penjadwal berkala di proses server (matikan dengan JADWAL_OTOMATIS=off)
  app/api/               match/[id]/chat (polling), match/[id]/skor (sinkron pencatat), push (langganan), cron
  app/berkas/…           file unggahan (logo/galeri publik, foto pemain dengan cek akses)
public/sw.js             service worker Web Push
scripts/                 migrate, seed, create-platform-admin, periksa-layar
tests/                   Vitest; setup.ts meniru cookies/redirect Next dan membuat DB di memori
```

## Aliran data

- Halaman = Server Component; membaca data lewat `src/server/queries/*` setelah `requireRole`.
- Perubahan data = Server Action di `src/server/actions/*`. Setiap action **memeriksa sesi & peran sendiri**,
  memvalidasi input dengan zod, lalu memanggil logika di `src/server/*`.
- Form klien memakai `useActionState` + `TombolKirim` (spinner, tidak bisa dikirim dua kali).

## Autentikasi & hak akses

- Email + password (scrypt). Sesi = token acak 32 byte di cookie `ngebola_sesi` (httpOnly, SameSite=Lax, Secure di
  production), DB menyimpan hash SHA-256. Berlaku 30 hari.
- Lupa password: respons selalu sama; maks 5 permintaan/email/jam dan 60 global/jam; token 30 menit, sekali pakai,
  disimpan sebagai hash. Reset sukses mencabut semua sesi & token reset akun itu. Akun nonaktif tidak bisa direset.
- Login gagal dibatasi 10 kali/email/jam.
- Pendaftaran publik hanya untuk `club_admin` dan `player` (dibatasi schema zod). `platform_admin` lewat
  `npm run platform:admin`.
- `requireRole` dipanggil di layout **dan** di setiap page (layout & page dirender paralel), serta di setiap action.
  `tests/akses-halaman.test.ts` memanggil semua layout/page di `(app)` dengan tiap peran.

## Gaya

- Hanya utility Tailwind. Token di `@theme` (`bg-hijau`, `shadow-keras`, `rounded-kartu`, …). Warna dari data
  (warna club) memakai atribut `fill`/`style` karena nilainya dinamis.
- `cn` dari `@/lib/utils` sudah mengenal token kustom; jangan impor `cn` langsung dari paket `cn`
  (tanpa konfigurasi, `shadow-keras shadow-emas` dianggap bentrok).
- Ikon: komponen klien impor dari `@phosphor-icons/react` (bold lewat `IconContext`); komponen server impor dari
  `@phosphor-icons/react/ssr` dan tulis `weight="bold"`. Tab aktif `weight="fill"`.
- Satu tombol Utama per layar/kartu. Kolom isian tanpa bayangan keras.

## Status match & waktu

- Transisi status hanya lewat fungsi di `server/match.ts`, `server/hari-h.ts`, `server/tenggat.ts`; update memakai syarat
  status lama (`where status = …`) supaya dua aksi bersamaan tidak saling menimpa (mis. dua club menerima match terbuka).
- Semua tenggat (respons 72 jam, hasil 48 jam, bukti 48 jam, WO 20 menit, tunda 14 hari, pengingat) diproses
  `jalankanBerkala()` dan idempoten. Fungsi domain menerima `now` sehingga bisa dites tanpa memalsukan jam.
- Konstanta modul `"use client"` tidak bisa dipakai komponen server (yang terbaca hanya referensi klien); taruh di `src/db/enums.ts` atau `src/lib`.

## Gerak

- Token di `globals.css`: `--ease-pegas` (memantul, untuk lepas/pop), `--ease-keluar` (meluncur), animasi `masuk`, `pop`, `dialog-*`, `sheet-*`, `lapis-*`, `kilau`.
- Tailwind v4 menggeser lewat properti `translate` (bukan `transform`): transisi harus `transition-[translate,box-shadow]`.
- Varian `tekan:` = `:active` atau `[data-ditekan]`; `EfekTekan` (penyedia.tsx) menahan penanda minimal 140 ms agar ketukan singkat di HP tetap terlihat.
- `template.tsx` di club/pemain/platform membuat isi halaman memudar masuk (hanya opacity, 160 ms, agar tidak "goyang") saat pindah halaman (sidebar & navigasi diam).
- `prefers-reduced-motion` mematikan semua animasi (globals.css); `scripts/uji-gerak.mjs` mengukur gerak tombol di browser.

## Layar tidak boleh "melompat"

- `html { scrollbar-gutter: stable }` mencadangkan lebar scrollbar; karena itu `html body[data-scroll-locked]` (pengunci scroll Radix untuk Select/Dialog/Sheet) harus dinolkan margin/padding-nya (globals.css), kalau tidak isi halaman bergeser saat dropdown dibuka.
- Ukur dengan `node scripts/uji-lompat.mjs [url]` (memakai scrollbar asli, bukan headless tersembunyi).

## Aturan perubahan

- Tambah halaman di area peran: panggil `requireRole` di page; test akses otomatis mencakupnya.
- Tambah server action: periksa peran & kepemilikan data di dalam action, bukan hanya menyembunyikan tombol.
- Waktu: simpan UTC, tampilkan dengan `src/lib/waktu.ts` (WIB).
