# Status implementasi

Terakhir diperbarui: 28 Okt 2026. Acuan fase: [docs/PLAN.md](docs/PLAN.md).

| Fase | Status |
|---|---|
| 1 Fondasi | ✅ selesai |
| 2 Club, pemain, skuad, halaman publik | ✅ selesai |
| 3 Match, RSVP, chat | ✅ selesai |
| 4 Hari pertandingan, hasil, sengketa, rating | ✅ selesai |
| 5 Notifikasi & panel Admin platform | ✅ selesai |

## Fase 1 — Fondasi

Tersedia:
- Next.js 16.4 + Tailwind v4 + shadcn/ui (Radix) dengan token DESIGN.md; Plus Jakarta Sans; Phosphor bold.
- Komponen restyle: Button (Utama/Emas/Garis/Teks/Bahaya × K/S/B/ikon/bulat × normal/hover/ditekan/fokus/memuat/
  nonaktif, plus permukaan gelap), Input, Textarea, Select, Checkbox, Switch, Radio + RadioCard, Badge, Card, Dialog,
  Sheet, Toast (sonner), Tabs, Avatar, Calendar + Popover (bahasa Indonesia, Senin di kiri).
- Komponen khas: Lambang (stiker, otomatis inisial+warna, logo dalam bingkai, versi mini < 40px), BadgeStatus (14
  status), AvatarPemain (ilustrasi dari seed, jersey = warna club), navigasi bawah HP & sidebar desktop per peran,
  header, banner, skeleton, kartu kosong dengan maskot.
- Skema Drizzle lengkap (36 tabel) + migrasi + seed demo (8 club fiksi, 41 pemain, 5 lapangan, match di 14 status).
- Auth 3 peran: daftar (Admin club/Pemain, umur ≥ 17 WIB), masuk, keluar, lupa & reset password sesuai PRD 4.1,
  tampil/sembunyi password, batas laju. Admin platform lewat `npm run platform:admin`.
- Kerangka halaman per peran + `/dev/komponen`.
- Tes: 54 lolos (auth, batas laju, reset, akses setiap layout/page × 3 peran, penggabung kelas).
- `npm run periksa`: semua alur lolos di 390 px & 1280 px, tanpa error konsol dan tanpa geser horizontal.

## Fase 2 — Club, pemain, skuad, halaman publik

Tersedia:
- Registrasi club (A-02/A-04): satu akun satu club, nama unik per kota, nomor HP pengurus (hanya untuk platform),
  status Diajukan → Disetujui/Ditolak (alasan wajib). Club ditolak memperbaiki data lalu otomatis diajukan ulang.
- Antrean verifikasi Admin platform (/platform/verifikasi): setujui/tolak, tercatat di audit_logs, notifikasi dalam
  aplikasi + email (mode demo).
- Profil club (C-01..C-05): edit data, logo ≤ 2 MB (PNG/JPG/WebP dicek dari isi file), warna lambang & jersey, galeri ≤ 10
  foto, statistik otomatis (main, M/S/K, selisih gol, rating per format, keandalan, sportivitas), level sementara < 5 hasil.
- Skuad (P-02): kode skuad 6 karakter (bisa diganti), tautan undangan 7 hari (bisa dicabut, bisa dibagikan), minta gabung,
  setujui/tolak, keluarkan, keluar; satu club aktif per pemain (dicek server + indeks unik DB); RSVP mendatang dihapus.
- Profil pemain (P-01): nama, foto ≤ 2 MB, posisi, kaki dominan, area. Foto pemain dilayani lewat /berkas dengan cek akses
  (bukan publik). Profil pemain hanya untuk diri sendiri, admin club-nya, sesama anggota aktif, dan Admin platform.
- Publik: beranda (match terbuka + leaderboard), /jelajahi (filter club/area, format, level; alamat lapangan manual tidak
  tampil), /leaderboard per format (peringkat resmi ≥ 5 hasil, berbagi peringkat bila sama, rating sementara 1–4),
  /profil-club/[slug] (tanpa data pemain; club belum disetujui/ditangguhkan = 404; head-to-head untuk Admin club lain).
- Rating Elo per format (PRD 7.1) diterapkan saat match Selesai; seed menerapkannya berurutan waktu.
- Parameter `lanjut` di masuk/daftar (hanya path internal) untuk tautan undangan & "ikut sparring".
- Tes: 75 lolos. `npm run periksa`: alur daftar club → verifikasi → kode skuad → gabung → disetujui lolos.

## Fase 3 — Match, RSVP, chat

Tersedia:
- Match terbuka (M-01): 1–3 opsi jadwal (≥ 25 jam lagi, ≤ 90 hari), lapangan direktori (disaring per format) atau manual
  ("belum terverifikasi"), total biaya, area/level opsional; maks 3 aktif per club (bisa diatur via platform_settings).
- Tantangan langsung (M-03) dari profil/kartu club; satu tantangan aktif per pasangan (dua arah); club yang saling blokir
  tidak bisa menantang. Layar tantangan menampilkan head-to-head & keandalan (peringatan < 60%). Rematch (M-07) mengisi
  format & lapangan dari match sebelumnya.
- Respons (M-04, S-01): terima satu opsi (harus ada lapangan), tolak, tawar balik maks 3 putaran bergiliran; tenggat 72 jam
  atau 24 jam sebelum opsi terawal. Dua club menerima match terbuka bersamaan → yang pertama menang (update bersyarat).
- Tenggat otomatis (instrumentation, tiap 60 dtk; atau POST /api/cron): kedaluwarsa tantangan/negosiasi/match terbuka,
  penundaan > 14 hari → dibatalkan tanpa penalti.
- Setelah terkonfirmasi: perubahan jadwal/lapangan & penundaan hanya sah setelah disetujui lawan, riwayat tercatat (S-04,
  S-06); pembatalan wajib alasan, < 24 jam = penalti keandalan kecuali cuaca dengan bukti (S-05, 7.2).
- RSVP pemain (P-03) Ikut/Ragu/Tidak, terkunci 2 jam sebelum kick-off. Kesiapan (R-01..R-03): jumlah dari RSVP Ikut atau
  manual, tombol siap nonaktif di bawah 8/5, tanda siap dicabut otomatis bila jumlah turun (termasuk saat pemain keluar).
- Chat per match (8.3): hanya kedua admin, pesan sistem untuk tiap perubahan status, bagikan lokasi (hanya saat diketuk),
  filter kata kasar, laporkan pesan, blokir club; ditutup 7 hari setelah Selesai; polling tiap 5 detik.
- Halaman: Cari Lawan (tab Match terbuka + Club), Jadwal (Masuk/Terkirim/Jadwal/Riwayat), detail match, buat match,
  tantang; Pemain: beranda + RSVP, jadwal (mendatang, hasil club, riwayat yang diikuti), detail match tanpa chat/aksi.
- Tes: 100 lolos (19+1 tes domain match). `npm run periksa`: terima match terbuka, buat match, tawar balik → terima, chat,
  RSVP lolos tanpa error konsol.

## Fase 4 — Hari pertandingan, hasil, sengketa, rating

Tersedia:
- Check-in (D-01): tombol muncul saat jendela terbuka (60 menit sebelum kick-off s.d. +20 menit), GPS opsional hanya bila
  dicentang. Mulai match butuh kedua check-in; admin yang menekan Mulai lebih dulu menjadi satu-satunya pencatat (W-01).
- Pencatat skor (D-02, W-04): gol/koreksi per club, akhiri babak 1, mulai babak 2, peluit akhir (dialog). Catatan disimpan
  dulu di perangkat (localStorage) dan disinkron ke /api/match/[id]/skor; offline = banner koneksi, kirim ulang otomatis;
  server idempoten (clientEntryId), catatan yang bentrok/terlambat ditandai konflik dan tampil di laporan (D-03).
  Club lawan melihat skor langsung (polling 5 dtk); tidak ada pemantauan publik.
- WO (D-06): hanya satu club check-in setelah 20 menit → WO 3-0, tidak mengubah Elo; tidak ada yang hadir → dibatalkan,
  keduanya penalti keandalan.
- Konfirmasi hasil (H-01, H-05): pengusul = pencatat; lawan Setuju/Sanggah dalam 48 jam; tanpa respons skor pengusul sah.
- Sengketa (H-02, 9.2, 9.3): bukti tautan + catatan 48 jam; penyanggah tanpa bukti → skor pengusul disahkan otomatis;
  Admin platform memutus (pengusul/penyanggah/koreksi/batal) dengan alasan wajib, audit, notifikasi + email.
- Rating Elo per format diterapkan saat Selesai; anti-manipulasi (7.4): > 3 match pasangan sama dalam 30 hari → diabaikan
  dari rating & ditandai; lonjakan > 200 poin dalam 5 match → antrean tinjauan. Level dikoreksi setelah 5 hasil.
- Penilaian (H-06): sportivitas & kerapian 1–5 + komentar ≤ 200 (filter kata kasar), tersembunyi sampai keduanya mengisi
  atau 7 hari; rata-rata 10 terakhir di profil.
- Laporan match (H-04): skor per babak, check-in, pemain siap, linimasa catatan skor. Tugas hari H masuk "Perlu Anda lakukan".
- Tes: 114 lolos. `npm run periksa`: check-in → pencatat → peluit akhir → konfirmasi → penilaian; sanggah + bukti;
  keputusan sengketa platform — semua lolos tanpa error konsol.

## Fase 5 — Notifikasi & panel Admin platform

Tersedia:
- Notifikasi dalam aplikasi untuk semua pemicu PRD 8.4 (tantangan, tawar balik, perubahan jadwal, kesiapan lawan, pengingat,
  konfirmasi hasil, hasil resmi, sengketa, status registrasi, skuad, moderasi). Halaman Pemberitahuan per peran, titik merah
  di lonceng, buka = tandai dibaca (/buka/[id]), tandai semua dibaca. Angka merah di navigasi = hal yang perlu ditanggapi.
- Web Push standar (VAPID, paket `web-push`): aktifkan per perangkat, langganan terikat sesi (dicabut saat keluar/reset),
  isi push generik (judul + tautan), langganan mati (404/410) dihapus, status kirim tercatat. Service worker `/sw.js`,
  manifest PWA (iPhone: buka dari Layar Utama).
- Preferensi: push on/off, jam senyap WIB, bisukan pengingat; sengketa & pengingat 2 jam tetap dikirim.
- Email Resend (mode demo di development): reset password, status registrasi, sengketa & keputusannya, moderasi.
- Pengingat otomatis (S-03, P-06): H-3/H-1/2 jam ke admin, H-1/2 jam ke pemain (kecuali yang menjawab Tidak); R-04: club
  belum siap diumumkan di chat pada H-1; H-05: 2 pengingat sebelum tenggat konfirmasi hasil. Idempoten lewat reminder_log.
- Panel Admin platform: dasbor angka & match per status; verifikasi; sengketa; laporan & moderasi (sembunyikan pesan,
  kecualikan penilaian, tolak); pola anti-manipulasi (pasangan sering, lonjakan rating, penilaian timbal balik/bintang 1);
  semua club (tangguhkan → match aktif dibatalkan tanpa penalti bagi lawan, cabut, peringatan, koreksi data); detail match
  baca-saja + chat; direktori lapangan (tambah/ubah, verifikasi, slot info); pengguna (cari, nonaktifkan/aktifkan → sesi
  dicabut); log audit; pengaturan parameter rating & batas match terbuka. Semua tindakan beralasan & tercatat di audit.
- Tes: 131 lolos. `npm run periksa`: semua alur fase 1–5 lolos di 390 px & 1280 px tanpa error konsol/geser horizontal.
- `next build` production lolos.

## Tambahan setelah Fase 5

- **Privasi (UU PDP):** halaman /syarat-layanan & /kebijakan-privasi, kotak persetujuan wajib saat daftar (waktu + versi dokumen tersimpan), tautan di footer & halaman masuk, hapus akun mandiri untuk Pemain (anonimkan data pribadi, keluar skuad, hapus RSVP/notifikasi/sesi/push; hasil match tetap tanpa identitas).
- **Gerak:** token easing/animasi di globals.css, efek tekan `tekan:` (juga untuk tautan), halaman memudar masuk tanpa bergeser, dialog/sheet beranimasi.
- **Form ringkas:** /daftar muat satu layar HP; form club melipat isian opsional; reset form otomatis setelah galat dicegah (pilihan Radix & isian tetap).
- **Leaderboard:** menampilkan total main + menang/seri/kalah per format (dari hasil yang dirating).

## Menyimpang dari referensi (disengaja)

| Referensi | Implementasi | Alasan |
|---|---|---|
| Login Google + kode 6 digit | Email + password | PRD 4.1 (keputusan PLAN.md butir 1) |
| "Sparring gampang. Iuran beres." | "Sparring gampang. Hasil tercatat." | iuran di luar cakupan |
| Tab Iuran (Wallet) | Peran-spesifik (PLAN.md bagian 3) | iuran di luar cakupan |
| Nomor punggung & ban kapten di avatar | tidak ada | PLAN.md butir 5 |
| Lambang demo sebagai stiker perisai | logo demo tampil di bingkai "logo unggahan" | lambang demo diperlakukan seperti logo unggahan agar alur unggah nanti sama |
| Navigasi bawah bersudut bawah 24 (bingkai HP di referensi) | menempel di bawah layar, tepi atas 2px | bukan mockup ponsel |
| Badge status hanya 5 | 14 status dengan bentuk & token sama | PLAN.md butir 16 |
| Radius 16/18/22 di beberapa papan | ditambahkan sebagai token `popover`/`dialog` | nilai dari referensi, bukan gaya baru |

## Keterbatasan

- Web Push belum diuji ke perangkat/browser nyata (hanya jalur server & UI); butuh HTTPS selain localhost.
- Tenggat 72/48/24 jam & batas pemain mengikuti PRD dan belum bisa diatur dari panel (hanya parameter rating & batas match terbuka).
- Deteksi akun ganda (7.4) belum otomatis; Admin platform menandai/menindak manual.
- Banding sengketa (P1), ikuti club (P1), ulasan lapangan (P1), ekspor data (P1), .ics (P2) belum dibuat.
- Judul tab `/dev/komponen` masih ada di build production walau isinya 404.
- Satu run tes pertama yang lambat (mesin sibuk) sempat timeout 2 tes; run ulang lolos semua.

- Syarat Layanan & Kebijakan Privasi adalah draf awal yang ditulis dari perilaku app; **wajib ditinjau penasihat hukum** sebelum rilis. Alamat kontak resmi diatur lewat `KONTAK_EMAIL`.
- Hak hapus akun baru untuk Pemain (mandiri). Admin club & Admin platform menghapus akun lewat Admin platform (belum ada alat hapus/anonimkan akun mereka).
- Perubahan versi dokumen belum memicu persetujuan ulang akun lama (versi tersimpan di `users.consent_version`).
- `npm run periksa` memakai emulasi viewport, bukan perangkat nyata.
- Folder proyek belum repository git.
- Unggahan disimpan di folder `uploads/` lokal (bukan object storage); perlu dipindah saat deploy multi-server.

## Pertentangan PRD vs DESIGN

Dicatat di [docs/PLAN.md](docs/PLAN.md) bagian 5 (29 butir) beserta keputusan yang dipakai.

## Beranda & footer baru (SEO)

- `/` ditulis ulang: hero berkata kunci, strip angka nyata (`statistikBeranda()`), cara kerja, match terbuka ringkas, "kenapa dipercaya" (bento), leaderboard top 5, untuk Admin club/Pemain, FAQ (`src/lib/faq.ts`, juga jadi JSON-LD FAQPage), CTA penutup. Komponen di `src/components/ngebola/beranda.tsx`.
- Footer publik 4 kolom (`footer-publik.tsx`); email kontak tampil hanya jika `KONTAK_EMAIL` diisi; tanpa tautan media sosial/WA karena belum ada akunnya. Header publik sticky.
- SEO: metadata root (`metadataBase` dari `APP_URL`, Open Graph, Twitter), canonical, JSON-LD, `sitemap.xml` (club disetujui), `robots.txt`, `opengraph-image`. **Production wajib mengisi `APP_URL` dengan domain HTTPS.**
- Gerak: reveal saat gulir CSS murni (`muncul`, hanya bila didukung & tanpa reduced-motion), marquee kecamatan (berhenti saat hover/reduced-motion).

## Poles halaman admin (club & platform)

- Statistik club 3 kolom (tidak ada kartu sendirian); tombol utama "Match baru" di beranda club; header profil club tidak lagi memotong nama; pilihan level tidak saling menimpa di 390 px.
- Beranda platform: chip "Match per status" 3 kolom tanpa teks bertabrakan. Daftar jadwal/sengketa: nama lawan boleh 2 baris.
- Filter Cari Lawan lebih ringkas di HP; "Keluarkan" anggota & "Tandai semua dibaca" punya label teks; laporan tanpa garis tepi samping; log audit memakai istilah yang terbaca.
- `npm run periksa` perlu `DEV_LOG=<file log dev server>`; alur hapus akun dilewati selama peran Pemain ditahan (butuh `FITUR_PEMAIN=1`).

## Penyeragaman halaman publik dengan konsep beranda

- Komponen bersama `src/components/ngebola/seksi.tsx`: `HeroHalaman` (band hijau bergaris di bawah header pil), `Seksi`/`JudulSeksi` (kicker + judul besar), `PilihFormat` (sakelar format), konstanta `LATAR_LAPANGAN`, `KICKER`, `TAUTAN_PANAH`. Beranda memakai komponen yang sama.
- `/jelajahi`, `/leaderboard`, `/profil-club/[slug]`, `/syarat-layanan`, `/kebijakan-privasi` kini memakai hero band; filter/kontrol/statistik menumpang di tepi bawah hero.
- `KartuMatchTerbuka` satu desain untuk beranda, `/jelajahi`, Cari Lawan admin. `PanelStatistik` bergaya strip (dashboard & profil). Leaderboard memakai `PilihFormat` + `CatatanPeringkat`.
- Dokumen hukum: daftar isi lengket di samping (desktop). Panel kiri halaman masuk/daftar memakai teks yang sama dengan hero beranda.
