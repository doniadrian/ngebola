# Database & rencana migrasi ke Supabase

Skema: [src/db/schema.ts](../src/db/schema.ts) (Drizzle, SQLite lewat `better-sqlite3`). Daftar nilai status:
[src/db/enums.ts](../src/db/enums.ts). Migrasi SQL: [drizzle/](../drizzle/). Rancangan per tabel: [PLAN.md](PLAN.md) bagian 2.

## Konvensi (agar mudah dipindah ke Postgres)

| Hal | SQLite sekarang | Postgres nanti |
|---|---|---|
| id | `text` UUID dari `crypto.randomUUID()` | `uuid` / `text` |
| waktu | `integer` mode `timestamp_ms` (UTC) | `timestamptz` |
| boolean | `integer` mode `boolean` | `boolean` |
| enum | `text` + daftar nilai di `enums.ts` (dicek di TypeScript/zod) | `text` + `check` atau enum |
| uang | `integer` Rupiah | `integer` / `bigint` |
| nama kolom | snake_case (`casing: "snake_case"`) | sama |
| unik bersyarat | partial unique index (`squad_satu_aktif`) | didukung sama |

Tidak dipakai: `rowid`, kolom JSON, fungsi SQL khusus SQLite, tipe dinamis. Semua query lewat query builder Drizzle.
Transaksi memakai `db.transaction(cb)` sinkron (driver better-sqlite3); saat pindah ke Postgres callback menjadi async.

## Tabel (36)

- **Akun & keamanan:** `users`, `sessions` (hash token), `password_reset_tokens` (hash, 30 menit, sekali pakai),
  `rate_limit_events`.
- **Club, pemain, skuad:** `clubs`, `club_photos`, `players`, `squad_memberships` (satu `aktif` per pemain),
  `squad_invites`.
- **Lapangan:** `venues`, `venue_photos`, `venue_slots`.
- **Match:** `matches`, `schedule_proposals`, `match_change_requests`, `match_readiness`, `rsvps`, `checkins`,
  `score_entries`, `result_confirmations`, `disputes`, `dispute_evidence`, `reviews`, `club_ratings`, `rating_history`.
- **Komunikasi & platform:** `chat_messages`, `club_blocks`, `reports`, `notifications`, `notification_deliveries`,
  `push_subscriptions` (terikat sesi), `notification_prefs`, `reminder_log`, `moderation_flags`, `audit_logs`,
  `platform_settings`.

## Aturan data penting

- Token sesi dan reset hanya disimpan sebagai SHA-256; nilai aslinya hanya ada di cookie/email.
- Menghapus sesi selalu menghapus `push_subscriptions` milik sesi itu lebih dulu (foreign key).
- `score_entries`, keputusan sengketa, dan `audit_logs` hanya ditambah, tidak dihapus (PRD 12.1).

## Migrasi

- `0000_awal` — 36 tabel.
- `0001_skor_akhir` — `matches.final_creator_score` / `final_opponent_score` (skor resmi setelah Selesai; dipakai statistik,
  riwayat, head-to-head, leaderboard).

- `0002_persetujuan` — `users.consent_at` / `consent_version` (persetujuan Syarat & Privasi saat daftar).

## Kunci `platform_settings`

`rating.awal`, `rating.k_baru`, `rating.k_lama`, `rating.batas_baru`, `match.maks_terbuka` (diubah lewat /platform/pengaturan,
tercatat di audit). Tanpa baris = nilai bawaan PRD.

## Mengubah skema

1. Ubah `src/db/schema.ts` (dan `enums.ts` bila perlu).
2. `npm run db:generate` → file baru di `drizzle/`.
3. `npm run db:migrate` (atau otomatis saat `npm run dev`).

## Pindah ke Supabase (rencana)

1. Ganti import `drizzle-orm/sqlite-core` → `drizzle-orm/pg-core` di `schema.ts` dengan pemetaan tipe di atas.
2. Ganti driver di `src/db/index.ts` (`drizzle-orm/postgres-js`), ubah `db.transaction` menjadi async.
3. `drizzle-kit generate` untuk dialek `postgresql`, terapkan ke Supabase.
4. Ekspor data SQLite per tabel (urut sesuai foreign key) lalu impor.
