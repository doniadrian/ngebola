# Cara menjalankan & verifikasi

## Kebutuhan

- Node.js 22+ (dikembangkan dengan Node 24). npm.
- Untuk `npm run periksa`: Microsoft Edge atau Google Chrome terpasang (dipakai lewat `playwright-core`, tanpa unduh browser).

## Mulai cepat

```bash
npm install
npm run db:reset      # migrasi, kosongkan semua tabel, isi data demo
npm run dev           # migrasi otomatis lalu http://localhost:3000
```

Konfigurasi opsional: salin `.env.example` ke `.env.local`. Tanpa konfigurasi apa pun app berjalan dengan SQLite di
`data/ngebola.db` dan email mode demo.

## Akun demo (password semua: `ngebola-demo-123`)

| Peran | Email | Catatan |
|---|---|---|
| Admin platform | `admin@ngebola.test` | dibuat seed (di production lewat perintah internal) |
| Admin club | `club@ngebola.test` | Lancang Kuning FC (disetujui) |
| Pemain | `pemain@ngebola.test` | skuad Lancang Kuning FC |
| Pemain tanpa club | `pemain.baru@ngebola.test` | untuk mencoba gabung skuad |
| Admin club lain | `garuda@`, `sukajadi@`, `tenayan@`, `rumbai@`, `marpoyan@ngebola.test` | club disetujui |
| Club menunggu / ditolak | `kulim@ngebola.test` / `sailmuda@ngebola.test` | status registrasi |

Seed membuat 8 club fiksi (lambang dari `referensi/Lambang.html`, disimpan di `public/demo/lambang/`), 41 pemain,
5 lapangan fiktif, dan match di ke-14 status. Waktu match relatif terhadap saat seed dijalankan.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | server development (menjalankan `db:migrate` dulu) |
| `npm run build` / `npm start` | build & jalankan production (`start` menjalankan migrasi dulu) |
| `npm test` | Vitest: auth, hak akses tiap halaman, logika domain (DB SQLite di memori per file) |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run periksa` | cek di browser (390 px & 1280 px): tangkapan layar ke `screens/`, error konsol, geser horizontal, alur daftar/masuk/keluar/reset. Server dev harus jalan; isi `DEV_LOG=<file log dev>` agar tautan reset dari terminal terbaca. |
| `npm run db:generate` | buat migrasi baru dari `src/db/schema.ts` |
| `npm run db:migrate` | terapkan migrasi |
| `npm run db:seed` | isi data demo (hanya ke database kosong) |
| `npm run db:reset` | kosongkan semua tabel lalu seed ulang (aman saat server dev jalan) |
| `npm run platform:admin -- --email x@domain --nama "Nama"` | buat akun Admin platform (password acak dicetak sekali; atau `--password`) |

## Email

- Development tanpa `RESEND_API_KEY`: isi email (termasuk tautan reset password) dicetak di terminal server dengan
  judul `EMAIL DEMO (tidak dikirim)`.
- Production: isi `RESEND_API_KEY`, `EMAIL_FROM` (pengirim terverifikasi di Resend), dan `APP_URL` HTTPS.

## Pekerjaan berkala (tenggat, WO, pengingat)

- Otomatis tiap 60 detik di proses server (`src/instrumentation.ts`), cocok untuk deploy satu server dengan SQLite.
- Deploy multi-instance/serverless: set `JADWAL_OTOMATIS=off`, isi `CRON_SECRET`, lalu panggil tiap menit:
  `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://domain/api/cron`.
- Seed memakai waktu relatif saat dijalankan; match "hari H" (kick-off 30 menit setelah seed) otomatis menjadi WO/dibatalkan
  bila dibiarkan. Jalankan `npm run db:reset` untuk data segar (aman walau server dev sedang jalan).

## Web Push

- Development: kunci VAPID dibuat otomatis di `data/vapid.json`. Production: isi `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY` (`npx web-push generate-vapid-keys`) dan `VAPID_SUBJECT`. Butuh HTTPS selain localhost.
- Aktifkan dari halaman Pemberitahuan tiap peran. iPhone: tambahkan ke Layar Utama lalu buka dari sana.

## Galeri komponen

`/dev/komponen` menampilkan semua komponen & keadaan untuk audit visual. Halaman ini 404 di production.

## Cek manual sebelum menyebut UX mobile siap

PRD meminta uji di perangkat nyata. `npm run periksa` memakai emulasi viewport 390 px, bukan perangkat nyata.
