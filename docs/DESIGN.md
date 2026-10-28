# Ngebola — Design System v0.1

Platform sparring + iuran untuk fun club sepak bola, mulai di Pekanbaru.
Gaya visual: **"stiker lapangan"** — garis tinta tebal, isi warna datar, bayangan keras tanpa blur,
diambil dari cara maskot Pak Bola digambar. Bahasa UI: Indonesia santai.

Referensi visual lengkap ada di `referensi/*.html` (buka di browser). File itu adalah **gambar acuan**,
bukan kode produksi — bangun ulang sebagai komponen di stack proyek.

| File referensi | Isi |
|---|---|
| Main.html, Gelap.html | Tombol: varian, tema terang & gelap |
| Anatomi.html | Ukuran, padding, perilaku tombol + CSS dasar |
| Matriks.html | Semua varian × keadaan (warna hover/ditekan) |
| Pola.html | Ikon Phosphor, segmen, chip filter, bar aksi HP, boleh/jangan |
| Kartu.html | 9 jenis kartu |
| Lambang.html | Lambang tim (stiker), badge status, avatar ilustrasi |
| Form.html | Kolom isian, Rupiah, tanggal, lapangan, stepper, radio, sakelar, kode OTP |
| Navigasi.html | Navigasi bawah HP, header, tab, sidebar desktop |
| Umpan-Balik.html | Toast, banner, dialog, bottom sheet, layar sukses, skeleton |
| Login-HP.html, Kode-HP.html, Login-Desktop.html | Layar login (Google + email/kode) |

## Token

```css
:root {
  /* warna */
  --hijau: #123b2c;        /* utama, teks judul, tepi */
  --hijau-hover: #1d5641;
  --hijau-tua: #0b2419;    /* ditekan, bayangan di latar gelap */
  --emas: #c9a14a;         /* aksen, bayangan tombol Utama */
  --emas-hover: #d6b263;  --emas-tekan: #b48d3a;
  --emas-tua: #6b5320;     /* label seksi, teks di atas krem */
  --krem: #f2ede0;         /* latar halaman */
  --krem-terang: #fbf8f1;  /* latar kartu & kolom */
  --tinta: #14201a;        /* teks utama, garis lambang/avatar */
  --teks-2: #3b4a41;       /* teks sekunder */
  --placeholder: #6f6a5a;
  --merah: #a8382a;  --merah-hover: #b8452f;  --merah-tekan: #8e2e22;
  --kuning-kartu: #f6d36b;
  --nonaktif-bg: #e4ddcc;  --nonaktif-tepi: #cfc6b1;
  /* latar badge */
  --bg-menunggu: #f6e7bf;  --bg-ditawar: #dbe5f2;  --bg-saran: #d5e6dc;  --bg-error: #fdf3f1;

  /* bentuk */
  --tepi: 2px;
  --r-kecil: 10px; --r-tombol: 12px; --r-besar: 14px; --r-kartu: 20px; --r-sheet: 26px;
  --bayangan: 0 4px 0;     /* tanpa blur, warna per komponen */
}
```

- **Font:** Plus Jakarta Sans (Google Fonts) 500/600/700/800. Teks isian kolom minimal 16px.
- **Ikon:** Phosphor (`@phosphor-icons/react` atau paket sesuai stack). **Bold** di tombol & UI, **Fill** untuk tab aktif, **Duotone** untuk ilustrasi kecil. Ikon di referensi digambar ulang mirip Phosphor — ganti dengan ikon resmi.

## Aturan inti

1. **Tombol** — tepi 2px hijau, bayangan keras `0 4px 0`. Utama: latar hijau, bayangan emas. Varian lain: bayangan hijau. Ditekan: `translateY(4px)` + bayangan hilang (80ms). Hover: naik 1px, bayangan 5px.
   - Varian: Utama, Emas (uang), Garis, Teks (garis bawah), Bahaya (merah).
   - Ukuran: K 40 / S 48 (default) / B 56 (bar aksi bawah HP).
   - Satu tombol Utama per layar/kartu. Utama di kanan / paling dekat jempol.
   - Memuat: lebar tetap, spinner, tidak bisa diklik ulang (cegah bayar dua kali).
   - Fokus keyboard: cincin 3px **hijau** offset 3px di latar terang; **emas** di latar gelap.
2. **Kartu** — sudut 20, padding 20, tepi 2px hijau. Bisa diklik = + bayangan `0 4px 0 hijau`. Info saja = tanpa bayangan.
3. **Kolom isian** — tinggi 52, tepi 2px hijau, **tanpa bayangan keras** (itu jatah tombol). Fokus: latar putih + halo `0 0 0 4px rgba(201,161,74,.6)`. Error: tepi merah + pesan dengan ikon.
4. **Chip filter** berbentuk pil tanpa bayangan; **badge** kotak 7px kapital 11px + tepi tinta + bayangan 2px.
5. **Badge status pakai bahasa lapangan:** Ditolak = kartu merah, Terlambat = kartu kuning, Selesai = bendera finis, **LUNAS = stempel miring** (bukan badge).
6. **Lambang tim** — efek stiker potong: tepi tinta 8, pinggir krem 3, bayangan keras 3px. Logo unggahan masuk bingkai yang sama. Di bawah 40px pakai versi mini (tanpa pinggir/teks).
7. **Avatar** — ilustrasi kepala gaya Pak Bola (warna kulit, rambut, aksesori acak) untuk pemain tanpa foto. Jersey = warna tim. Nomor punggung kanan bawah, ban kapten "C" emas miring kiri bawah.
8. **Navigasi bawah HP** — Beranda, Jadwal, **Cari Lawan (tombol bola menonjol di tengah)**, Iuran, Tim. Angka merah = perlu ditanggapi; titik merah = baru tapi tidak mendesak. Hanya di 5 halaman utama.
9. **Umpan balik** — Toast 4 dtk (hijau berhasil, tinta bisa diurungkan, merah gagal & tidak hilang sendiri, krem info). Aksi merusak wajib ada "Urungkan" 6 dtk. Dialog Bahaya: judul pertanyaan, isi menyebut akibat dengan angka nyata, tombol aman paling bawah. Momen besar (iuran lunas, ajakan diterima) = layar penuh dengan Pak Bola.
10. **Login** — tanpa password: "Lanjut dengan Google" atau email → kode 6 digit (`autocomplete="one-time-code"`, bisa ditempel, verifikasi otomatis di digit ke-6). Akun dibuat saat masuk pertama. **Tombol Google wajib pakai tombol/aset resmi Google Identity Services** (di referensi hanya placeholder "G").
11. **Aksesibilitas** — kontras teks ≥ 4.5:1, area sentuh ≥ 44px, `<button>`/`<a>`/`<label>` asli, `aria-label` di tombol ikon, status tidak hanya dibedakan warna, hormati `prefers-reduced-motion`.

## Aset

- `assets/logo/` — logo (SVG & PNG, terang/gelap), favicon & ikon PWA di `assets/logo/web/`.
- `assets/maskot/` — Pak Bola, terang & gelap (SVG + PNG transparan).

Semua nama tim, lapangan, pemain dan nominal di referensi adalah contoh fiktif.
