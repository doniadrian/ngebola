# Ngebola

Web app sparring antar club fun football, fokus awal Pekanbaru: cari lawan, sepakati jadwal & lapangan,
catat skor, dan bangun rating club dari hasil yang dikonfirmasi kedua pihak.

Stack: Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · SQLite + Drizzle.

## Mulai

```bash
npm install
npm run db:reset   # migrasi + data demo
npm run dev        # http://localhost:3000
```

Akun demo dan perintah lengkap: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Di mode development,
halaman `/masuk` punya tombol "masuk cepat" per peran.

## Dokumen

| Dokumen | Isi |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Kebutuhan produk (fungsi) |
| [docs/DESIGN.md](docs/DESIGN.md) · [docs/referensi/](docs/referensi/) | Design system & gambar acuan visual |
| [docs/PLAN.md](docs/PLAN.md) | Rencana kerja per fase |
| [docs/CODEBASE.md](docs/CODEBASE.md) | Peta kode & aturan perubahan |
| [docs/DATABASE.md](docs/DATABASE.md) | Skema & rencana pindah ke Postgres/Supabase |
| [docs/STATUS.md](docs/STATUS.md) | Status fitur, keterbatasan, pekerjaan tersisa |
| [CLAUDE.md](CLAUDE.md) | Aturan tetap proyek |
