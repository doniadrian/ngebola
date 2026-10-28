# Rencana implementasi Ngebola

Acuan: [PRD.md](PRD.md) (fungsi), [DESIGN.md](DESIGN.md) + `referensi/` (tampilan), [CLAUDE.md](../CLAUDE.md) (aturan tetap).
Keputusan yang masih menunggu jawaban ditandai **[?]** dan dirangkum di bagian 6.

## 1. Struktur folder

```
ngebola-app/
├─ CLAUDE.md  AGENTS.md  README.md
├─ docs/                               # PRD, DESIGN, PLAN, CODEBASE, STATUS, DATABASE, DEVELOPMENT
│  └─ referensi/                       # gambar acuan visual (HTML), tidak diubah
├─ assets/                             # sumber asli logo & maskot, tidak diubah
├─ public/
│  ├─ brand/                           # salinan logo & maskot dari assets/ (apa adanya)
│  ├─ demo/lambang/                    # lambang club fiksi untuk seed
│  ├─ sw.js                            # service worker: Web Push + antrean skor offline
│  └─ manifest.webmanifest
├─ uploads/                            # file unggahan (dev); diabaikan git
├─ drizzle/                            # migrasi SQL hasil drizzle-kit
├─ scripts/
│  ├─ seed.ts                          # data demo
│  ├─ create-platform-admin.ts         # provisioning internal Admin platform
│  └─ cron.ts                          # pengingat, kedaluwarsa, tenggat 48 jam, WO
├─ src/
│  ├─ app/
│  │  ├─ (publik)/                     # tanpa login: /, /jelajahi, /leaderboard, /profil-club/[slug]
│  │  ├─ (auth)/                       # /masuk, /daftar, /lupa-password, /reset-password/[token]
│  │  ├─ (app)/
│  │  │  ├─ club/...                   # Admin club
│  │  │  ├─ pemain/...                 # Pemain
│  │  │  └─ platform/...               # Admin platform
│  │  ├─ undangan/[token]/             # tautan undangan skuad
│  │  ├─ api/                          # route handler (push subscribe, sync skor, cron)
│  │  └─ dev/komponen/                 # galeri komponen, hanya development
│  ├─ components/
│  │  ├─ ui/                           # shadcn yang sudah di-restyle
│  │  └─ ngebola/                      # Lambang, BadgeStatus, AvatarPemain, KartuMatch, NavBawah, Sidebar …
│  ├─ db/
│  │  ├─ schema.ts                     # seluruh tabel Drizzle
│  │  ├─ enums.ts                      # daftar nilai status (text) + label Indonesia
│  │  └─ index.ts                      # koneksi
│  ├─ server/
│  │  ├─ auth/                         # sesi, hash password, reset, batas laju
│  │  ├─ authz.ts                      # requireRole, requireClubAdmin(matchId), requireSquadMember …
│  │  ├─ actions/                      # server actions per domain (club, skuad, match, hasil, platform)
│  │  ├─ domain/                       # logika murni: transisi status, Elo, keandalan, peringkat, tenggat
│  │  └─ notify/                       # in-app, Web Push, email (Resend / demo terminal)
│  └─ lib/                             # format WIB, Rupiah, validasi zod
└─ tests/                              # vitest: domain murni + server action dengan DB sementara
```

Tes: Vitest dengan database SQLite sementara per file tes. Logika status/Elo/peringkat ditaruh di `server/domain`
sebagai fungsi murni supaya mudah dites dan dipindah.

## 2. Skema database

Konvensi (portabel ke Postgres): id `text` UUID; waktu `integer` mode `timestamp_ms` (→ `timestamptz`);
boolean `integer` mode `boolean` (→ `boolean`); enum sebagai `text` + nilai dari `enums.ts`; uang dalam Rupiah
`integer`; tanpa kolom JSON; unik bersyarat memakai *partial unique index* (didukung SQLite & Postgres).
Format: `football` (11v11) | `mini`. Semua waktu disimpan UTC, ditampilkan WIB.

### Akun & keamanan

| Tabel | Kolom | Catatan |
|---|---|---|
| `users` | id, email (unik, huruf kecil), password_hash, role (`club_admin`/`platform_admin`/`player`), name, birth_date, status (`aktif`/`nonaktif`/`ditangguhkan`), created_at, updated_at, deleted_at | Umur ≥ 17 dicek saat daftar. Hapus akun = data pribadi dikosongkan, baris tetap untuk riwayat. |
| `sessions` | id, token_hash (unik), user_id → users, created_at, expires_at, user_agent | Cookie httpOnly berisi token acak; DB menyimpan hash. Reset password menghapus semua sesi user. |
| `password_reset_tokens` | id, user_id → users, token_hash (unik), expires_at (+30 mnt), used_at, created_at | Sekali pakai; reset sukses mencabut semua token user. |
| `rate_limit_events` | id, bucket (mis. `reset:email:x`, `reset:global`, `login:ip:x`), created_at | Hitung kejadian dalam jendela 1 jam. 5/email/jam, 60 global/jam. |

### Club, pemain, skuad

| Tabel | Kolom | Catatan |
|---|---|---|
| `clubs` | id, admin_user_id → users (**unik**), slug (unik), name, name_key, city (default `Pekanbaru`), area, founded_year, level (`pemula`/`menengah`/`mahir`), description, logo_path, crest_color, initials, jersey_home, jersey_away, registration_status (`diajukan`/`disetujui`/`ditolak`), rejection_reason, reviewed_by → users, reviewed_at, suspended_at, suspension_reason, squad_code (unik), created_at, updated_at | Unik (city, name_key). Belum `disetujui` atau ditangguhkan = tidak bisa bertanding. |
| `club_photos` | id, club_id → clubs, path, sort_order, created_at | Maks 10 per club (dicek di server). |
| `players` | user_id → users (PK), photo_path, position (`kiper`/`bek`/`gelandang`/`penyerang`), dominant_foot (`kanan`/`kiri`/`keduanya`), area, avatar_seed, updated_at | Profil privat. |
| `squad_memberships` | id, player_user_id → users, club_id → clubs, status (`diundang`/`diajukan`/`aktif`/`ditolak`/`keluar`), via (`tautan`/`kode`), decided_by → users, created_at, decided_at, ended_at, ended_by (`pemain`/`admin`) | Partial unique: satu baris `aktif` per pemain. |
| `squad_invites` | id, club_id → clubs, token_hash (unik), created_by → users, expires_at, revoked_at, created_at | Tautan undangan; kode skuad ada di `clubs.squad_code`. |

### Lapangan

| Tabel | Kolom | Catatan |
|---|---|---|
| `venues` | id, name, address, area, lat, lng, surface (`alami`/`sintetis`), for_football, for_mini, price_per_hour, open_hours, facilities, contact, verified, managed_by → users, created_at, updated_at | Dikelola Admin platform. |
| `venue_photos` | id, venue_id → venues, path, sort_order | |
| `venue_slots` | id, venue_id → venues, day_of_week, start_time, end_time, note | Informasi saja, tidak bisa dipesan. |

### Match

| Tabel | Kolom | Catatan |
|---|---|---|
| `matches` | id, type (`terbuka`/`tantangan`), format, status (lihat di bawah), creator_club_id → clubs, opponent_club_id → clubs (null saat terbuka), area, level, fee_total, notes, scheduled_at, venue_id → venues, manual_venue_name, manual_venue_address, negotiation_round (0–3), response_deadline, scorer_club_id, started_at, ended_at, cancelled_by_club_id, cancel_reason, cancel_note, late_cancel, postponed_at, reschedule_deadline, wo_winner_club_id, rematch_of → matches, excluded_from_rating, created_by → users, created_at, updated_at | Status: `draf`, `terbuka`, `ditantang`, `dinegosiasi`, `terkonfirmasi`, `ditunda`, `berlangsung`, `menunggu_hasil`, `selesai`, `sengketa`, `ditolak`, `kedaluwarsa`, `dibatalkan`, `wo`. Maks 3 `terbuka` aktif per club; satu tantangan aktif per pasangan. |
| `schedule_proposals` | id, match_id → matches, round, proposed_by_club_id, starts_at, venue_id, manual_venue_name, manual_venue_address, fee_total, status (`menunggu`/`dipilih`/`ditolak`/`kedaluwarsa`), created_at | 1–3 opsi per putaran (Usulan Jadwal). |
| `match_change_requests` | id, match_id, kind (`jadwal`/`lapangan`/`tunda`), requested_by_club_id, from_value, to_value, reason, status (`menunggu`/`disetujui`/`ditolak`), decided_by → users, created_at, decided_at | Riwayat perubahan S-04; sah hanya bila disetujui lawan. |
| `match_readiness` | match_id, club_id (PK gabungan), players_ready, manual_override, is_ready, updated_at, updated_by | Kesiapan; dihitung dari RSVP `ikut` kecuali override. |
| `rsvps` | match_id, player_user_id (PK gabungan), club_id, answer (`ikut`/`tidak`/`ragu`), updated_at | Konfirmasi Ikut; terkunci 2 jam sebelum kick-off. |
| `checkins` | match_id, club_id (PK gabungan), checked_in_at, lat, lng, by_user_id | Dibuka 60 menit sebelum kick-off. |
| `score_entries` | id, match_id, half (1/2), creator_score, opponent_score, event (`mulai`/`skor`/`jeda`/`akhir_babak`/`selesai`), recorded_by → users, client_entry_id (unik, idempotensi offline), recorded_at (jam perangkat), synced_at, conflict | Tambah-saja, tidak dihapus. |
| `result_confirmations` | id, match_id (unik), proposer_club_id, creator_score, opponent_score, proposed_at, deadline (+48 jam), response (`setuju`/`sanggah`/null), counter_creator_score, counter_opponent_score, responded_at, reminders_sent | |
| `disputes` | id, match_id (unik), opened_at, evidence_deadline, decision (`pengusul`/`penyanggah`/`koreksi`/`batal`), final_creator_score, final_opponent_score, reason, decided_by → users, decided_at | |
| `dispute_evidence` | id, dispute_id, club_id, note, url, created_at | **[?]** tautan + teks, bukan unggahan file. |
| `reviews` | id, match_id, reviewer_club_id, reviewed_club_id, sportsmanship (1–5), tidiness (1–5), comment (≤200), excluded, created_at | Unik (match, reviewer). Tersembunyi sampai keduanya isi atau 7 hari. |
| `club_ratings` | club_id, format (PK gabungan), rating (awal 1200), confirmed_matches | Dibaca leaderboard. |
| `rating_history` | id, club_id, format, match_id, rating_before, rating_after, delta, created_at | |

### Komunikasi, notifikasi, platform

| Tabel | Kolom | Catatan |
|---|---|---|
| `chat_messages` | id, match_id, sender_user_id (null bila sistem), kind (`manusia`/`sistem`), body, lat, lng, hidden_by_moderator, created_at | Chat satu per match; pesan sistem tidak bisa dihapus. Ditutup 7 hari setelah Selesai. |
| `club_blocks` | blocker_club_id, blocked_club_id (PK gabungan), created_at | |
| `reports` | id, reporter_user_id, target_type (`pesan`/`ulasan`/`club`), target_id, reason, status (`terbuka`/`ditindak`/`ditolak`), resolved_by, resolution, created_at, resolved_at | Laporan pengguna. |
| `notifications` | id, user_id, trigger, title, body, url, read_at, created_at | Dalam aplikasi. |
| `notification_deliveries` | id, notification_id, channel (`push`/`email`), status (`menunggu`/`terkirim`/`gagal`), error, sent_at | |
| `push_subscriptions` | id, user_id, session_id → sessions, endpoint (unik), p256dh, auth, created_at | Dicabut saat logout/login baru. |
| `notification_prefs` | user_id (PK), push_enabled, quiet_start, quiet_end, mute_reminders | Sengketa & pengingat 2 jam tetap dikirim. |
| `reminder_log` | match_id, user_id, kind (`h3`/`h1`/`2jam`/`hasil1`/`hasil2`) (PK gabungan), sent_at | Cron idempoten. |
| `moderation_flags` | id, kind (`pasangan_sering`/`lonjakan_rating`/`akun_ganda`/`ulasan_pola`), club_id, other_club_id, match_id, detail, status (`terbuka`/`ditinjau`/`diabaikan`), resolved_by → users, created_at, resolved_at | Antrean tinjauan anti-manipulasi (PRD 7.4). |
| `audit_logs` | id, actor_user_id, action, target_type, target_id, reason, detail, created_at | Semua tindakan Admin platform + perubahan penting. |
| `platform_settings` | key (PK), value, updated_by, updated_at | Parameter rating, tenggat, batas match terbuka. |

Skor keandalan dan statistik publik dihitung dari `matches`/`result_confirmations` (tidak disimpan ganda).

## 3. Halaman per peran

**Publik (tanpa login):** `/` beranda · `/jelajahi` match terbuka (filter area, format, level) · `/leaderboard` (per format) ·
`/profil-club/[slug]` profil publik club (tanpa data pemain; bukan `/club/[slug]` agar tidak bentrok dengan area Admin club `/club/...`) · `/masuk` · `/daftar` · `/lupa-password` · `/reset-password/[token]`.

**Admin club** (`/club/...`): beranda (Perlu Anda lakukan + match berikutnya) · `daftar-club` (registrasi & status) ·
`profil` (edit, galeri) · `skuad` (undang, permintaan, anggota) · `jadwal` (daftar match) · `cari-lawan` · `match/baru` ·
`match/[id]` (detail, negosiasi, kesiapan, check-in, chat, pencatat skor, konfirmasi hasil, sengketa, penilaian) ·
`notifikasi` · `pengaturan`.

**Pemain** (`/pemain/...`): beranda (match berikutnya + RSVP) · `jadwal` · `match/[id]` (info + RSVP, tanpa chat/tindakan) ·
`skuad` (gabung lewat kode/undangan, anggota, keluar) · `profil` · `riwayat` (P1) · `notifikasi`.

**Admin platform** (`/platform/...`): beranda (antrean verifikasi, sengketa, laporan) · `verifikasi` · `sengketa` ·
`laporan` · `club` (semua club, tangguhkan) · `lapangan` (CRUD, slot) · `pengguna` (cari) · `audit` · `pengaturan`.

Navigasi bawah HP (5 tab, bola menonjol di tengah) **[?]** usulan:
- Admin club: Beranda · Jadwal · **Cari Lawan** · Skuad · Club
- Pemain: Beranda · Jadwal · Peringkat · Skuad · Profil (tanpa bola tengah karena pemain tidak mencari lawan)
- Admin platform: Beranda · Verifikasi · Sengketa · Lapangan · Lainnya
Desktop memakai sidebar sesuai `referensi/Navigasi.html`.

## 4. Pembagian fase

| Fase | Isi | Selesai bila |
|---|---|---|
| **1 Fondasi** | Setup Next.js, token Tailwind/CSS var, font, Phosphor; komponen shadcn yang di-restyle (Button 5 varian × state, Input, Select, Checkbox/Switch, Badge, Card, Dialog/Sheet, Toast, Tabs, Avatar, Calendar+Popover id); Lambang & BadgeStatus; skema Drizzle penuh + migrasi + seed demo; auth 3 peran (daftar, masuk, keluar, lupa/reset password, batas laju, token hash 30 mnt); layout nav bawah/sidebar per peran; `/dev/komponen`; tes auth & hak akses. | Daftar/masuk/keluar/reset jalan untuk 3 peran, tampilan cocok referensi di 390 px & desktop, tes lolos, 4 dokumen terisi. |
| **2 Club, pemain, skuad, publik** | Registrasi club (Diajukan/Disetujui/Ditolak + alasan); antrean verifikasi + audit; profil club (logo 2 MB, jersey, galeri 10, statistik); profil pemain; skuad (tautan/kode, minta gabung, setujui, keluarkan, keluar; satu club aktif); beranda publik, `/jelajahi`, `/leaderboard` dari seed + keadaan kosong; dashboard awal per peran. | Alur daftar club → disetujui → undang → pemain gabung berjalan; publik tampil benar; tes status, satu club, hak akses skuad, privasi pemain. |
| **3 Match, RSVP, chat** | Match terbuka (maks 3, kedaluwarsa) & tantangan langsung (satu per pasangan); terima/tolak/tawar balik (3 putaran, 72 jam); 1–3 opsi jadwal; lapangan direktori/manual; perubahan jadwal butuh persetujuan + riwayat; batal (alasan, <24 jam penalti), tunda (14 hari); RSVP pemain (kunci 2 jam); kesiapan (min 8/5, cabut otomatis); chat per match + pesan sistem + lokasi + lapor/blokir + filter kata kasar; rematch. | Alur cari lawan → sepakat berjalan dua akun club + pemain RSVP; tes transisi status & batas. |
| **4 Hari H, hasil, sengketa, rating** | Check-in (jendela 60 mnt, GPS opsional); satu pencatat aktif; skor per babak + offline & sinkron + konflik; WO 20 mnt (3-0, tanpa Elo); konfirmasi hasil 48 jam (skor pengusul sah bila diam); sengketa + bukti + keputusan platform; Elo per format (K 40/24, G); keandalan; penilaian tersembunyi; head-to-head; leaderboard nyata (peringkat resmi ≥5 hasil). | Main → konfirmasi hasil → rating berubah; tes Elo, peringkat, WO, tenggat. |
| **5 Notifikasi & panel platform** | Notifikasi in-app; Web Push (VAPID, terikat sesi, cabut saat logout); email Resend (reset, status registrasi, sengketa) dengan mode demo; cron pengingat H-3/H-1/2 jam & tenggat; preferensi & jam senyap; panel platform lengkap (dasbor angka, sengketa, moderasi/laporan, tangguhkan, lapangan & slot, cari pengguna, koreksi data, konfigurasi, log audit); anti-manipulasi dasar (tandai pola). | Notifikasi sampai ke peran yang benar; semua tindakan platform tercatat audit. |

## 5. Pertentangan & hal tidak jelas (PRD vs DESIGN/referensi)

Keputusan default yang akan dipakai bila tidak dijawab lain:

1. **Login.** DESIGN aturan 10 + Login-HP/Desktop/Kode-HP: tanpa password (Google + kode 6 digit email). PRD 4.1: email +
   password, OTP/Google backlog. → **PRD menang**: email + password; layar masuk memakai gaya referensi tanpa tombol
   Google; komponen kode OTP tidak dipakai. (Baris A-01 di tabel PRD masih menyebut OTP/Google P0 — dianggap usang.)
2. **Tab Iuran** di navigasi bawah, tagline "urus iuran tim" di login, kartu iuran, stempel LUNAS, "Dicek Admin" → dibuang.
   Pengganti tab: lihat usulan bagian 3.
3. **Format "Futsal"** muncul di referensi Kartu → hanya Football (11v11) dan Mini soccer.
4. **"Tim" vs "Club".** Referensi memakai "tim", PRD "club". → UI memakai **club** untuk entitas dan "skuad" untuk anggota.
5. **Avatar**: nomor punggung, ban kapten "C", label "Manajer tim"/"Kapten". PRD tidak punya data nomor/kapten. → avatar
   ilustrasi dipakai, **tanpa nomor punggung dan ban kapten**; jersey avatar = warna jersey home club; label peran
   "Admin club" / posisi pemain.
6. **Kartu hasil "Pencetak gol"**, biaya "Rp …/orang", "dibagi 50:50", dan pilihan Form "Sewa lapangan dibayar"
   (Patungan / bayar penuh / **Yang kalah bayar**) → dibuang (pembayaran di luar cakupan; "yang kalah bayar" juga dekat
   ke taruhan). Tampil skor dan **total biaya lapangan** saja.
7. **Gelap.html** hanya tombol di atas latar hijau, bukan mode gelap penuh. → tidak ada dark mode; varian gelap dipakai di
   permukaan hijau (panel kiri login desktop, header).
8. **Bukti sengketa.** H-02/9.2 minta foto/video, tetapi tabel cakupan MVP menolak "upload file bukti". → bukti berupa
   **tautan (mis. Google Drive) + catatan teks**. Sama untuk "bukti singkat" penundaan (S-06) dan batal karena cuaca (7.2).
9. **Pemblokiran.** 8.3 menyebut pemblokiran pengguna P0, M-08 blokir club P1. → blokir **club** (P0) dari chat dan tantangan.
10. **Bagian 11** menulis "tidak ada entitas pemain"; bagian 4.4 dan tabel entitas menambah Pemain/Skuad/RSVP. → 4.4 menang.
11. **Email.** Ringkasan PRD: email pertandingan belum aktif; tabel 8.4 minta email untuk sengketa & status registrasi.
    → Resend untuk reset password, status registrasi, dan sengketa saja.
12. **Nama produk**: PRD "Bola Fun Football", logo/DESIGN "Ngebola". → UI memakai **Ngebola**.
13. **Filter jarak** (M-02) butuh lokasi. → urutkan menurut area yang sama dulu; jarak hanya bila venue punya koordinat dan
    pengguna mengizinkan lokasi.
14. **Koreksi level** setelah 5 match (C-05) tanpa ambang Elo. → usulan: < 1150 Pemula, 1150–1300 Menengah, > 1300 Mahir.
15. **Pemain melihat leaderboard** (P-05) dan "Admin platform Baca chat" → sudah tercakup.
16. **Badge status.** Referensi hanya punya 5 badge sparring (Menunggu, Diterima, Ditolak, Ditawar, Selesai); PRD punya
    14 status. → status lain dibuat dengan bentuk badge yang sama dan latar dari token yang ada (`--bg-menunggu`,
    `--bg-ditawar`, `--bg-saran`, `--bg-error`, `--nonaktif-bg`), label teks + ikon selalu tampil. Badge iuran tidak dipakai.
17. **"Pemain per tim"** (stepper 7 lawan 7; Futsal 5 · Mini 6–8 · Besar 11) di Form → tidak dipakai. Cukup format
    Football/Mini; minimum siap tetap 8/5 (R-03).
18. **Jam main "Mulai – Selesai"** (Form) dan "19.00–21.00" (Kartu) vs PRD satu waktu kick-off → simpan dan tampilkan
    **kick-off saja**.
19. **Checkbox "bawa wasit sendiri", "butuh rompi", tag "Main malam / Sabtu–Minggu"** → tidak ada di PRD; cukup ditulis di
    catatan bebas. **"Siaran langsung (segera)"** dibuang (live score di luar cakupan).
20. **Cari Lawan.** Referensi: daftar *kartu club* + sakelar "Tim terbuka untuk ajakan". PRD: jelajahi *match terbuka*
    (M-02) dan tantang club dari profilnya (M-03). → halaman Cari Lawan berisi dua tab: **Match terbuka** dan **Club**
    (kartu club → profil → Tantang). Tanpa sakelar; semua club disetujui yang tidak saling blokir bisa ditantang.
21. **Banner "Lengkapi 7 pemain dulu supaya tim bisa terima ajakan"** → PRD tidak mensyaratkan jumlah anggota untuk
    menerima tantangan (R-01 boleh isi angka manual). → tidak ada syarat itu; pola banner dipakai untuk peringatan
    kesiapan di bawah 8/5.
22. **Header "ketuk nama tim untuk ganti tim"** → PRD satu club per akun; tanpa pengalih club.
23. **"Urungkan" 6 detik untuk semua aksi merusak** vs PRD (batal match langsung memberi tahu lawan dan bisa memberi
    penalti). → aksi yang mengubah status match atau memberi tahu pihak lain memakai **dialog Bahaya** (judul pertanyaan,
    akibat nyata), tanpa Urungkan. Urungkan hanya untuk aksi yang bisa dibalik tanpa efek ke pihak lain.
24. **Level "Santai"** di referensi → pakai Pemula / Menengah / Mahir (PRD C-05).
25. **Diagram siklus hidup** di PRD bagian 6 hilang (`[embedded content]`) → tabel transisi bagian 6 jadi acuan.
26. **Match terbuka:** M-01 menyebut "rentang tanggal", bagian 1 menyebut satu jadwal + alternatif sampai 3. → match
    terbuka menyimpan **1–3 opsi jadwal**; kedaluwarsa 24 jam sebelum opsi terakhir (sama dengan aturan tantangan).
27. **Verifikasi lapangan** P0 di 9.1 tetapi V-05 P1 → kolom `verified` disiapkan; Admin platform cukup menandai
    terverifikasi/belum (Fase 5). Lapangan manual selalu "belum terverifikasi".
28. **R-02 "kedua tanda siap diperlukan sebelum pengingat 2 jam"** tanpa akibat bila belum siap → hanya peringatan +
    pesan sistem (R-04); tidak ada pembatalan otomatis.
29. **Deteksi akun ganda (7.4)** memakai nomor HP, padahal akun tidak punya nomor HP → pakai email/logo yang sama; hanya
    ditandai ke `moderation_flags`, tanpa tindakan otomatis.

## 6. Pertanyaan untuk pemilik produk

1. Setuju login **email + password** tanpa Google (butir 1)?
2. Isi navigasi bawah per peran (bagian 3) — setuju usulan, atau ada urutan lain?
3. Bukti sengketa cukup **tautan + catatan** (butir 8), atau unggah foto tetap dibutuhkan?
4. Daftar **area** untuk Pekanbaru: pakai 15 kecamatan Pekanbaru (Bukit Raya, Marpoyan Damai, Tenayan Raya, Sukajadi, Rumbai, …)
   atau daftar lain?
5. Avatar tanpa nomor punggung/kapten (butir 5) — setuju?
6. Ambang koreksi level (butir 14) — setuju usulan?
7. Saat daftar, perlu **tanggal lahir** untuk cek umur ≥ 17, atau cukup centang "Saya berusia minimal 17 tahun"?
8. Pemain boleh daftar akun tanpa langsung bergabung club (masuk lewat kode belakangan)? Asumsi: boleh.
9. Cari Lawan dengan dua tab **Match terbuka + Club**, tanpa sakelar "terbuka untuk ajakan" (butir 20) — setuju?
10. Data registrasi club (PRD 13.4 masih terbuka): cukup isian profil club + nomor kontak pengurus (hanya terlihat oleh
    Admin platform), tanpa unggah dokumen? Atau ada dokumen lain?
11. Boleh pakai 6 lambang fiktif di `referensi/Lambang.html` (Lancang Kuning FC, Garuda Sail FC, Sukajadi United,
    Tenayan Raya FC, Rumbai Veteran, Marpoyan Damai FC) sebagai data demo?
12. Aksi merusak memakai dialog konfirmasi, bukan "Urungkan" (butir 23) — setuju?
