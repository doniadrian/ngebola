# PRD Bola Fun Football (Fokus Antar Club)

Revisi: 27 Oktober 2026 · Acuan produk aktif · Visual diatur terpisah di [DESIGN.md](DESIGN.md)

> Keputusan terbaru: web app Next.js, Tailwind CSS, dan komponen resmi shadcn/ui. Tiga peran: Admin club, Admin platform, dan Pemain (akses terbatas). Hanya dua format: Football (11v11) dan Mini soccer. SQLite untuk sementara; Supabase direncanakan. Status implementasi aktual ada di [STATUS.md](STATUS.md); kebutuhan di dokumen ini tetap menjadi target produk.

## 1. Ringkasan, Tujuan & Ruang Lingkup

Bola Fun Football mempertemukan club sepak bola amatir/komunitas untuk bertanding satu sama lain: cari lawan, sepakati jadwal dan lapangan, jalankan match, catat skor, lalu bangun reputasi club dari hasilnya. Tujuan MVP hanya satu: **match antar club yang terjadi, tercatat, dan bisa dipercaya**.

**Fokus fase awal: club melawan club.** Unit data pertandingan adalah club (satu club, satu admin); pemain ikut sebagai anggota skuad dengan akses terbatas. Match hanya mencatat dua club, jadwal, lapangan, jumlah pemain yang siap, dan skor. Profil pemain, keanggotaan skuad, dan konfirmasi ikut (RSVP) masuk MVP (bagian 4.4); statistik karier, lineup, pencetak gol, dan kas skuad tetap ditunda ke bagian 13.

### Prinsip MVP sederhana

Notifikasi luar tab menggunakan Web Push standar, tanpa layanan notif berbayar. Setiap pengguna mengaktifkan secara sukarela pada perangkatnya. Platform menerima club baru/sengketa/laporan; club menerima pembaruan pertandingan dari notifikasi aplikasi. Pesan push club bersifat generik tanpa chat, bukti atau data admin; tautan membuka halaman privat. Langganan terikat sesi, dapat dinonaktifkan dan dicabut saat logout/login baru. HTTPS diperlukan selain localhost; iPhone membuka app dari Layar Utama. Jadwal pengingat memerlukan cron server, dan delivery tetap bergantung izin/browser/perangkat. Email pertandingan dan WA belum menjadi integrasi aktif.

Kontrol form/filter menggunakan Select shadcn; tanggal menggunakan Calendar + Popover dengan bahasa Indonesia, jam WIB dan nilai form yang tetap kompatibel. Area scroll internal memakai ScrollArea shadcn. Pengguliran halaman tetap mengikuti browser dan kalender harus dapat digunakan pada layar pendek.

Seluruh tampilan (warna, tipografi, bentuk komponen, ikon, logo, maskot) mengikuti design system di [DESIGN.md](DESIGN.md); PRD ini tidak mengatur gaya visual. Komponen dibangun dari shadcn/ui yang dikustomisasi sesuai DESIGN.md, tanpa menambahkan analitik atau angka ilustrasi. Dashboard desktop menempatkan antrean tindakan di samping konten utama; mobile mengutamakan tindakan sebelum konten utama.

Lambang club pada data demo memakai lambang fiksi, bukan logo club profesional, sehingga tidak menyiratkan keikutsertaan club nyata.

Mobile memiliki navigasi bawah sesuai role, target sentuh minimal 44 px, safe area, daftar hasil/leaderboard tanpa geser tabel, dan form yang dapat discroll pada viewport pendek. Panel tugas kosong tidak mendahului jadwal. Aturan verifikasi, status dan angka peringkat tetap sama dengan desktop. Uji pada perangkat nyata diperlukan sebelum menyebut UX mobile siap rilis.

Alur Admin club harus mudah diikuti: **cari lawan → sepakat → main → konfirmasi hasil**.

- Dashboard mengutamakan daftar **Perlu Anda lakukan** dan pertandingan berikutnya. Hanya tampilkan tindakan yang sesuai peserta, status, dan batas waktu; tindakan milik lawan tidak masuk antrean club sendiri.
- Form awal cukup lawan/match terbuka, format, satu jadwal, lapangan, dan biaya. Jadwal alternatif dapat ditambahkan sampai tiga. Area dan level mengikuti profil club; perubahan area/level serta catatan ditempatkan pada bagian opsional.
- Lapangan direktori difilter menurut format; isian manual hanya muncul bila pengguna memilih lapangan lain.
- Check-in baru menjadi tombol ketika jendela waktunya terbuka. Mulai match memerlukan check-in kedua club. Skor tersedia setelah mulai; konfirmasi hanya untuk pihak yang belum mengonfirmasi dalam tenggat.
- Jika kesiapan sudah terkunci namun belum lengkap, arahkan ke chat untuk koordinasi, bukan menampilkan tombol kesiapan yang akan ditolak.
- Dashboard Admin platform membuka antrean verifikasi club, sengketa, dan laporan. Daftar semua club dan audit tetap tersedia sebagai pilihan sekunder. Pengelolaan/verifikasi lapangan berada di menu Lapangan.
- Rating dan statistik detail tetap tersedia di profil club. Grafik analitik, filter periode, ekspor dashboard, dan pengaturan kebijakan lanjutan tidak menjadi bagian dashboard utama MVP.
- Verifikasi club, persetujuan perubahan jadwal, pemeriksaan otorisasi server, dan konfirmasi hasil tetap wajib. Penyederhanaan tampilan tidak menghapus perlindungan tersebut.

### Penjelajahan dan leaderboard publik

- Pengunjung tanpa akun dapat membuka beranda, `/jelajahi`, dan `/leaderboard`. Ini bukan peran akun tambahan; hanya pengguna terdaftar (Admin club, Admin platform, Pemain) yang dapat login.
- “Club sedang mencari lawan” berarti club terverifikasi memiliki match berstatus Terbuka, belum memiliki lawan, dan masih memiliki opsi jadwal di masa depan. Ini berbeda dari tanda kesiapan pemain menjelang kick-off.
- Kartu publik menampilkan identitas club, area, format, level, jadwal, nama venue direktori, dan total biaya. Tantangan langsung, data akun/admin, chat, bukti, catatan internal, dan alamat lapangan manual tidak dipublikasikan.
- Tersedia filter club/area, format, dan level. Tombol ikut sparring mengarah ke pendaftaran dengan konteks pertandingan tetap tersimpan. Club baru harus disetujui terlebih dahulu; pendaftaran tidak otomatis menerima tantangan.
- Leaderboard terbuka untuk pengunjung dan pengguna terdaftar, dihitung terpisah per format dari hasil Selesai. Hasil sengketa, WO, atau belum dikonfirmasi tidak menambah Elo.
- Nomor peringkat resmi diberikan setelah minimal lima hasil terkonfirmasi pada format yang sama. Club dengan satu hingga empat hasil ditampilkan sebagai rating sementara tanpa nomor peringkat. Club tanpa hasil belum masuk daftar. Club ditolak/ditangguhkan tidak ditampilkan.
- Peringkat disusun menurut rating Elo; rating sama berbagi peringkat. Filter pencarian tidak menghitung ulang nomor peringkat. Data dapat diperbarui dengan tombol Perbarui.
- Live score, pemantauan publik saat pertandingan berjalan, tautan berbagi live, dan API live dihapus dari scope. US-13 dan D-04 dari draf lama dicabut. Pencatatan skor, konfirmasi hasil, riwayat, dan leaderboard tetap dipertahankan.

### Asumsi (mohon dikoreksi)

- Platform awal web responsif untuk desktop dan browser mobile. Aplikasi native di luar implementasi saat ini.
- Pasar awal Indonesia, bahasa Indonesia, mata uang Rupiah.
- Format permainan hanya Football (11v11) dan Mini soccer.
- Pilot di satu kota padat; jumlah club awal ditentukan di pertanyaan terbuka.

### Masalah yang diselesaikan

- Mencari lawan sparring lewat grup WhatsApp dan kenalan lambat, dan sering batal sepihak.
- Tidak ada standar tingkat kemampuan, sehingga match sering timpang.
- Skor dan hasil tidak tercatat; club tidak punya rekam jejak yang bisa ditunjukkan ke calon lawan.
- Urusan lapangan dan biaya diatur manual dan rawan sengketa.

### Tujuan produk

| Tujuan                           | Ukuran keberhasilan (6 bulan pasca-rilis)                              |
| -------------------------------- | ---------------------------------------------------------------------- |
| Mempermudah club menemukan lawan | Median waktu dari tantangan sampai match terkonfirmasi di bawah 48 jam |
| Match benar-benar terjadi        | Minimal 70% match terkonfirmasi berakhir dengan hasil tercatat         |
| Hasil dipercaya kedua pihak      | Minimal 90% hasil dikonfirmasi tanpa sengketa                          |
| Club kembali bertanding          | Minimal 40% club aktif bermain lagi dalam 30 hari                      |

### Ruang lingkup MVP

| Masuk MVP                                               | Tidak masuk MVP                                   |
| ------------------------------------------------------- | ------------------------------------------------- |
| Registrasi dan verifikasi club, profil club, akun pemain, skuad, RSVP             | Statistik karier, kartu pemain                |
| Match terbuka, tantangan langsung, tawar balik          | Lineup, formasi, guest player        |
| Penjadwalan, direktori lapangan, chat per match         | Pencetak gol, kartu, pergantian, MVP match        |
| Jumlah pemain siap per match, check-in, skor per babak  | Kas club, absensi, kalender latihan, inventaris   |
| Konfirmasi hasil, sengketa, rating club, skor keandalan | Booking dan pembayaran lapangan, split bill       |
| Notifikasi dalam aplikasi dan Web Push, panel platform  | Email/WhatsApp otomatis, upload file bukti |

### Bukan tujuan

- Bukan platform siaran langsung berkualitas broadcast.
- Bukan aplikasi taruhan atau fantasy berhadiah uang.
- Bukan manajemen liga profesional atau club di bawah federasi resmi.
- Tidak menggantikan registrasi pemain resmi PSSI/Asprov.

## 2. Pengguna & Persona

Ada **tiga peran aktif**: Admin club, Admin platform, dan Pemain (akses terbatas). Suporter tidak memiliki akun. Pengunjung dapat menjelajahi tantangan terbuka dan leaderboard tanpa login.

| Persona        | Siapa                                                    | Kebutuhan utama                                                                                        |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Admin club     | Satu akun untuk satu club, satu club memiliki satu admin | Lawan setara, jadwal pasti, kesiapan club, pencatatan skor, hasil dan reputasi                         |
| Admin platform | Tim pengelola Bola Fun                                   | Verifikasi club, kelola direktori lapangan dan slot informasi, moderasi, keputusan sengketa, log audit |
| Pemain         | Anggota skuad satu club                                  | Tahu jadwal match, konfirmasi ikut atau tidak, lihat hasil dan profil sendiri                          |

### Hak akses

| Tindakan                                         | Admin club                                     | Admin platform                              |
| ------------------------------------------------ | ---------------------------------------------- | ------------------------------------------- |
| Daftar akun secara mandiri                       | Ya, minimal 17 tahun                           | Tidak; dibuat melalui provisioning internal |
| Kelola profil club                               | Club sendiri                                   | Tinjau dan moderasi                         |
| Buat/terima/tolak/tawar tantangan                | Ya, club disetujui                             | Tidak                                       |
| Kelola lapangan, fasilitas, harga, dan info slot | Tidak                                          | Ya                                          |
| Isi jumlah pemain dan check-in                   | Club sendiri                                   | Tidak                                       |
| Mulai match dan catat skor                       | Satu admin club peserta sebagai pencatat aktif | Tidak                                       |
| Konfirmasi atau sanggah hasil                    | Kedua admin club peserta                       | Putuskan saat sengketa                      |
| Chat pertandingan                                | Kedua admin club peserta                       | Baca untuk moderasi                         |
| Verifikasi club dan lapangan                     | Tidak                                          | Ya                                          |
| Putuskan sengketa dan tangguhkan club            | Tidak                                          | Ya, wajib alasan dan audit                  |

Tidak ada akun pemilik lapangan atau akun wasit. Informasi kontak lapangan tetap bisa dicatat oleh Admin platform. Pencatat adalah salah satu Admin club peserta; bukan peran akun tambahan.

### Hak akses Pemain

| Tindakan                                                | Pemain                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| Daftar akun secara mandiri                              | Ya, minimal 17 tahun                                       |
| Kelola profil sendiri                                   | Ya                                                         |
| Bergabung ke skuad                                      | Lewat undangan atau kode skuad, disetujui Admin club       |
| Konfirmasi ikut/tidak ikut (RSVP)                       | Match club sendiri                                         |
| Lihat jadwal, lawan, lapangan, dan hasil club sendiri   | Ya                                                         |
| Chat match, tantangan, check-in, skor, konfirmasi hasil | Tidak                                                      |
| Lihat profil pemain lain                                | Hanya sesama anggota skuad (dan Admin club/platform)       |

## 3. User Stories & Alur Utama

Alur utama admin club berjalan dari registrasi sampai rematch dalam tujuh langkah; cabang di luar jalur ini (tolak, tawar balik, batal, WO, sengketa) dijelaskan di bagian 6.

### Alur utama (happy path)

1. Admin mengikuti sesi registrasi club dan melengkapi profil club; admin platform memverifikasi.
2. Admin membuat match terbuka atau menantang club tertentu.
3. Lawan menerima; kedua admin menyepakati jadwal dan lapangan lewat chat match.
4. Admin mengisi jumlah pemain yang siap dan menandai club siap main.
5. Hari H: kedua admin check-in, match berjalan, skor dicatat per babak.
6. Kedua admin mengonfirmasi skor akhir; rating club dan riwayat head-to-head diperbarui.
7. Kedua admin saling menilai sportivitas, lalu bisa mengajukan rematch.

### User stories

| ID    | Sebagai                                  | Saya ingin                                                            | Agar                                                     | Prioritas |
| ----- | ---------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- | --------- |
| US-01 | Admin club                               | mendaftarkan club lewat sesi registrasi                               | club saya terverifikasi dan dipercaya lawan              | P0        |
| US-02 | Admin club                               | membuat match terbuka dengan format, area, rentang tanggal, dan level | lawan yang cocok bisa menemukan saya                     | P0        |
| US-03 | Admin club                               | menjelajahi match terbuka dengan filter                               | saya bisa langsung menerima yang sesuai                  | P0        |
| US-04 | Admin club                               | menantang club tertentu dari profilnya                                | saya bisa mengulang lawan favorit                        | P0        |
| US-05 | Admin club                               | menawar balik jadwal atau lapangan                                    | kedua pihak mencapai kesepakatan tanpa batal             | P0        |
| US-06 | Admin club                               | mengajukan beberapa opsi waktu                                        | lawan tinggal memilih satu                               | P0        |
| US-07 | Admin club                               | menandai jumlah pemain siap                                           | lawan tahu club saya benar-benar bisa main               | P0        |
| US-08 | Admin club                               | check-in di lokasi                                                    | kedua pihak tahu match siap mulai dan WO bisa dibuktikan | P0        |
| US-09 | Admin club peserta yang menjadi pencatat | mencatat skor per babak, termasuk saat offline                        | hasil tidak hilang meski sinyal buruk                    | P0        |
| US-10 | Admin club                               | mengonfirmasi atau menyanggah skor akhir                              | catatan resmi akurat                                     | P0        |
| US-11 | Admin club                               | melihat rating, keandalan, dan head-to-head calon lawan               | saya memilih lawan setara dan bisa dipercaya             | P0        |
| US-12 | Admin club                               | menilai sportivitas lawan                                             | club yang baik mendapat reputasi                         | P0        |
| US-14 | Admin club                               | menerima rekomendasi lawan setara                                     | saya tidak perlu mencari manual                          | P1        |
| US-15 | Admin platform                           | mengelola profil dan informasi slot lapangan                          | club mudah memilih lapangan saya                         | P0        |
| US-16 | Admin platform                           | memutus sengketa dengan bukti kedua pihak                             | kepercayaan terhadap catatan terjaga                     | P0        |
| US-17 | Pemain                                   | mendaftar dan bergabung ke skuad club lewat undangan                  | saya tercatat sebagai anggota club saya                  | P0        |
| US-18 | Pemain                                   | melihat jadwal match club dan konfirmasi ikut atau tidak              | admin tahu siapa yang benar-benar bisa main              | P0        |
| US-19 | Admin club                               | mengundang dan mengelola anggota skuad                                | jumlah pemain siap terisi dari konfirmasi, bukan tebakan | P0        |
| US-20 | Pemain                                   | melihat riwayat match yang saya ikuti                                 | saya punya rekam jejak bermain                           | P1        |

## 4. Kebutuhan Fungsional: Club, Pencarian Lawan & Tantangan

Semua kebutuhan di bagian 4 dan 5 wajib ada di rilis pertama kecuali ditandai lain. Prioritas: **P0** wajib MVP, **P1** segera setelah MVP, **P2** nanti.

### 4.1 Akun & registrasi club

| ID   | Kebutuhan                                                                      | Kriteria penerimaan                                                                                            | Prioritas |
| ---- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------- |
| A-01 | Daftar/masuk dengan nomor HP (OTP) atau Google                                 | OTP kedaluwarsa dalam 5 menit; maksimal 5 percobaan per jam per nomor                                          | P0        |
| A-02 | Satu akun admin terhubung ke satu club, dan satu club hanya punya satu admin   | Sistem menolak pendaftaran club kedua dengan akun yang sama                                                    | P0        |
| A-03 | Tiga peran: Admin club, Admin platform, Pemain                                            | Pendaftaran publik membuat Admin club atau Pemain (dipilih saat daftar); akun platform dibuat internal | P0        |
| A-04 | Sesi registrasi club: admin mengisi data club, lalu admin platform memvalidasi | Status registrasi: Diajukan, Disetujui, Ditolak (dengan alasan); club belum bisa bertanding sebelum Disetujui  | P0        |
| A-05 | Pengalihan admin club ke orang lain                                            | Perlu persetujuan admin lama dan validasi admin platform; riwayat tercatat                                     | P1        |
| A-06 | Lencana club terverifikasi (dokumen atau foto pengurus dicek admin platform)   | Lencana tampil di profil dan hasil pencarian                                                                   | P1        |

Alur dan dokumen sesi registrasi ditentukan kemudian (lihat pertanyaan terbuka).

Tambahan akun yang disetujui pengguna:

- Login, daftar, password baru, dan konfirmasi password memiliki toggle tampil/sembunyi yang dapat diakses dengan keyboard. Kondisi awal tersembunyi; toggle tidak mengirim form dan tidak menghapus isi.
- Pemulihan password berlaku untuk semua peran melalui email akun. Respons permintaan bersifat umum tanpa mengungkap keberadaan akun. Maksimal lima permintaan per email per jam dan 60 secara global per jam.
- Tautan acak berlaku 30 menit, disimpan sebagai hash, dan hanya berlaku sekali. Password baru minimal 10 dan maksimal 128 karakter, dengan konfirmasi pada form. Reset sukses mencabut seluruh sesi serta tautan reset akun tersebut, tanpa mengubah peran/club. Akun nonaktif tidak dapat direset.
- Pengiriman email melalui konfigurasi Resend. Preview tautan di terminal hanya untuk development dengan mode demo; production memerlukan URL HTTPS serta pengirim terverifikasi. OTP/Google tetap backlog terpisah.

### 4.2 Profil club

| ID   | Kebutuhan                                                                                                          | Kriteria penerimaan                            | Prioritas |
| ---- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | --------- |
| C-01 | Data profil: nama, logo, jersey home dan away, basis area, tahun berdiri, level, deskripsi                         | Nama club unik per kota; logo maksimal 2 MB    | P0        |
| C-02 | Galeri foto club                                                                                                   | Maksimal 10 foto                               | P0        |
| C-03 | Statistik publik club: jumlah match, menang/seri/kalah, selisih gol, rating, skor keandalan, rata-rata sportivitas | Dihitung otomatis dari hasil terkonfirmasi     | P0        |
| C-04 | Riwayat match dan head-to-head terhadap club yang sedang dilihat                                                   | Tampil di profil dan di layar tantangan        | P0        |
| C-05 | Level club: Pemula, Menengah, Mahir, dipilih admin lalu dikoreksi oleh rating setelah 5 match                      | Tanda "provisional" selama kurang dari 5 match | P0        |
| C-06 | Ikuti club (follow)                                                                                                | Notifikasi hasil resmi club yang diikuti       | P1        |

### 4.3 Pencarian lawan & tantangan

| ID   | Kebutuhan                                                                                                               | Kriteria penerimaan                                                                         | Prioritas |
| ---- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------- |
| M-01 | Buat **match terbuka**: format (Football 11v11 atau Mini soccer), area, rentang tanggal, level, biaya lapangan, catatan | Maksimal 3 match terbuka aktif per club; otomatis kedaluwarsa setelah rentang tanggal lewat | P0        |
| M-02 | Jelajahi match terbuka dengan filter area, jarak, tanggal, level, format                                                | Hasil diurutkan dari yang terdekat dan paling cocok; match club sendiri disembunyikan       | P0        |
| M-03 | **Tantang club tertentu** dari profilnya, dengan opsi waktu dan lapangan                                                | Satu club hanya bisa punya satu tantangan aktif ke club yang sama pada saat yang sama       | P0        |
| M-04 | Lawan dapat **terima**, **tolak**, atau **tawar balik** (usul jadwal/lapangan lain)                                     | Tawar balik maksimal 3 putaran, setelah itu otomatis ditutup                                | P0        |
| M-05 | Rekomendasi lawan setara berdasarkan rating, area, dan jadwal                                                           | Selisih rating dan jarak ditampilkan                                                        | P1        |
| M-06 | Tantangan berulang atau sparring rutin mingguan                                                                         | Disetujui kedua pihak untuk jumlah pekan tertentu                                           | P2        |
| M-07 | Rematch dari match yang sudah selesai dengan satu ketukan                                                               | Detail format dan lapangan terisi dari match sebelumnya                                     | P0        |
| M-08 | Blokir club lain                                                                                                        | Club yang diblokir tidak bisa menantang atau melihat match terbuka                          | P1        |

### 4.4 Pemain & skuad

Pemain adalah anggota satu club dengan akses terbatas. Tidak ada lineup, formasi, atau pencatatan gol di MVP; fungsi pemain adalah memberi kepastian siapa yang benar-benar bisa main.

| ID   | Kebutuhan                                                                                          | Kriteria penerimaan                                                                  | Prioritas |
| ---- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------- |
| P-01 | Pemain mendaftar sendiri (email + password, sama dengan admin) dan melengkapi profil: nama, foto, posisi utama, kaki dominan, area | Usia minimal 17 tahun; foto maksimal 2 MB                  | P0        |
| P-02 | Admin club mengundang pemain lewat tautan atau kode skuad; pemain meminta bergabung; Admin club menyetujui | Satu pemain hanya punya satu club aktif; admin dapat mengeluarkan anggota, pemain dapat keluar | P0 |
| P-03 | Pemain mengonfirmasi Ikut, Tidak ikut, atau Ragu untuk tiap match terkonfirmasi club-nya           | Dapat diubah sampai 2 jam sebelum kick-off; perubahan tampil ke Admin club            | P0        |
| P-04 | Jumlah pemain siap dihitung dari RSVP berstatus Ikut                                               | Admin club dapat menyesuaikan angka manual; batas minimum R-03 tetap berlaku          | P0        |
| P-05 | Pemain melihat jadwal, lawan, lapangan, hasil, dan leaderboard                                     | Hanya match club sendiri; tanpa chat dan tanpa tindakan match                        | P0        |
| P-06 | Notifikasi ke pemain: undangan skuad, pengingat H-1 dan 2 jam, hasil match                         | Lewat push dan dalam aplikasi; dapat dinonaktifkan pemain                            | P0        |
| P-07 | Riwayat match yang diikuti (berdasarkan RSVP Ikut)                                                 | Hanya jumlah dan daftar match; tanpa gol atau assist                                 | P1        |

Privasi: profil pemain hanya terlihat oleh Admin club, sesama anggota skuad, dan Admin platform; tidak tampil di halaman publik.

## 5. Kebutuhan Fungsional: Jadwal, Kesiapan, Hari Pertandingan & Hasil

### 5.1 Penjadwalan & konfirmasi

| ID   | Kebutuhan                                                                         | Kriteria penerimaan                                                                                  | Prioritas |
| ---- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------- |
| S-01 | Usul jadwal dengan 1 sampai 3 opsi waktu; lawan memilih satu                      | Match berstatus Terkonfirmasi hanya setelah satu opsi dipilih dan lapangan terisi                    | P0        |
| S-02 | Pilih lapangan dari direktori venue atau isi manual (nama dan alamat)             | Lapangan manual ditandai "belum terverifikasi"                                                       | P0        |
| S-03 | Pengingat otomatis ke kedua admin pada H-3, H-1, dan 2 jam sebelum kick-off       | Terkirim lewat push; WhatsApp opsional                                                               | P0        |
| S-04 | Perubahan jadwal atau lapangan hanya sah bila disetujui kedua pihak               | Riwayat perubahan (siapa, kapan, dari apa ke apa) tersimpan dan tampil                               | P0        |
| S-05 | Pembatalan wajib disertai alasan dari daftar pilihan plus catatan bebas           | Pembatalan di bawah 24 jam sebelum kick-off menurunkan skor keandalan pembatal                       | P0        |
| S-06 | Penundaan (cuaca, lapangan tidak bisa dipakai) tanpa penalti dengan bukti singkat | Kedua pihak menyetujui alasan; jadwal baru dipilih dalam 14 hari atau match dibatalkan tanpa penalti | P0        |
| S-07 | Ekspor jadwal match ke Google Calendar                                            | Tautan .ics dari detail match                                                                        | P2        |

### 5.2 Kesiapan club

| ID   | Kebutuhan                                                   | Kriteria penerimaan                                                                     | Prioritas |
| ---- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------- |
| R-01 | **Jumlah pemain siap** per match: dihitung dari RSVP Ikut bila club punya skuad; bila belum, Admin mengisi angka | Dapat diubah sampai 2 jam sebelum kick-off; perubahan tampil ke lawan                   | P0        |
| R-02 | Tanda **club siap** atau **belum siap**                     | Kedua tanda siap diperlukan sebelum pengingat 2 jam                                     | P0        |
| R-03 | Batas minimal pemain per format; peringatan bila kurang     | Minimum: Football 11v11 = 8, Mini soccer = 5; di bawah batas, tombol siap dinonaktifkan | P0        |
| R-04 | Pengingat ke lawan bila club ditandai belum siap pada H-1   | Pesan sistem di chat match                                                              | P0        |

### 5.3 Hari pertandingan

| ID   | Kebutuhan                                                                                   | Kriteria penerimaan                                                                | Prioritas |
| ---- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------- |
| D-01 | **Check-in** kedua club di lokasi; GPS opsional                                             | Check-in dibuka 60 menit sebelum kick-off; match siap mulai bila keduanya check-in | P0        |
| D-02 | **Pencatat skor** (salah satu Admin club peserta): mulai, jeda, akhir babak, skor per babak | Hanya satu pencatat aktif per match; pencatat lain bisa melihat                    | P0        |
| D-03 | Pencatatan skor offline, sinkron otomatis saat koneksi kembali                              | Tidak ada data hilang; konflik sinkron ditandai dan diselesaikan manual            | P0        |
| D-05 | Pencatat adalah salah satu Admin club peserta                                               | Hanya satu pencatat aktif; tidak ada direktori atau akun wasit                     | P0        |
| D-06 | Penghitung waktu toleransi 20 menit untuk status WO                                         | Dimulai dari jadwal kick-off; pemicu WO bila hanya satu club check-in              | P0        |

### 5.4 Hasil & konfirmasi

| ID   | Kebutuhan                                                                        | Kriteria penerimaan                                                                                   | Prioritas |
| ---- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------- |
| H-01 | Setelah peluit akhir, kedua admin mengonfirmasi skor akhir                       | Notifikasi push langsung; tenggat 48 jam                                                              | P0        |
| H-02 | Bila skor berbeda atau disanggah, status **Sengketa**                            | Kedua pihak melampirkan bukti (foto papan skor atau video); admin platform memutus dalam 3 hari kerja | P0        |
| H-03 | Hasil final memperbarui head-to-head dan rating club secara otomatis             | Pembaruan selesai dalam 1 menit setelah status Selesai                                                | P0        |
| H-04 | Laporan match: skor, babak, lapangan, jumlah pemain tiap club, riwayat perubahan | Tersimpan pada riwayat pengguna terdaftar; tanpa pemantauan live atau tautan live publik              | P0        |
| H-05 | Tanpa respons dalam 48 jam, skor pengusul dianggap sah                           | Pengusul ditandai pada pencatatan awal; lawan menerima 2 pengingat sebelum tenggat                    | P0        |
| H-06 | Penilaian sportivitas dan kerapian (1 sampai 5) plus komentar singkat            | Saling tersembunyi sampai keduanya mengisi atau 7 hari berlalu                                        | P0        |

## 6. Siklus Hidup Match & Aturan Status

Setiap match melewati tujuh status utama dan bisa keluar ke cabang; sengketa selalu kembali ke Selesai setelah keputusan admin platform.

&#91;embedded content: siklus hidup match · 7 status utama, 3 cabang\]

Ditunda tidak mengakhiri match: setelah jadwal baru disepakati dalam 14 hari, match kembali ke Terkonfirmasi, dan bila tidak, match menjadi Dibatalkan tanpa penalti.

### Transisi dan pemicu

| Dari                      | Ke                        | Pemicu                                                    | Batas waktu                                         |
| ------------------------- | ------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| Draf                      | Terbuka/Ditantang         | Admin menerbitkan match terbuka atau mengirim tantangan   | Tidak ada                                           |
| Terbuka/Ditantang         | Dinegosiasi               | Lawan menerima dengan usulan, atau tawar balik            | 72 jam untuk merespons                              |
| Terbuka/Ditantang         | Ditolak/Kedaluwarsa       | Lawan menolak, atau tidak ada respons                     | 72 jam, atau 24 jam sebelum jadwal bila lebih dekat |
| Dinegosiasi               | Terkonfirmasi             | Kedua pihak menyetujui satu opsi jadwal dan lapangan      | Maksimal 3 putaran tawar balik                      |
| Dinegosiasi               | Ditolak/Kedaluwarsa       | Tidak sepakat setelah 3 putaran, atau tidak ada respons   | 72 jam per putaran                                  |
| Terkonfirmasi             | Dibatalkan                | Salah satu pihak membatalkan dengan alasan                | Di bawah 24 jam menurunkan skor keandalan pembatal  |
| Terkonfirmasi             | Ditunda                   | Kedua pihak menyetujui penundaan                          | Jadwal baru dalam 14 hari                           |
| Terkonfirmasi             | WO                        | Hanya satu club check-in sampai 20 menit setelah kick-off | Kemenangan administratif 3-0 bagi yang hadir        |
| Terkonfirmasi             | Berlangsung               | Kedua club check-in dan pencatat memulai babak pertama    | Check-in dibuka 60 menit sebelum kick-off           |
| Berlangsung               | Menunggu Konfirmasi Hasil | Pencatat menutup match setelah peluit akhir               | Segera                                              |
| Menunggu Konfirmasi Hasil | Selesai                   | Kedua admin mengonfirmasi, atau tidak ada respons         | 48 jam; tanpa respons, skor pengusul sah            |
| Menunggu Konfirmasi Hasil | Sengketa                  | Skor berbeda atau disanggah                               | Bukti dilampirkan dalam 48 jam                      |
| Sengketa                  | Selesai                   | Admin platform memutus                                    | 3 hari kerja sejak bukti lengkap                    |

## 7. Rating, Reputasi & Anti-Manipulasi

Reputasi club dibangun dari tiga angka yang berdiri sendiri: kekuatan (rating), keandalan, dan sportivitas. Ketiganya hanya dihitung dari match yang hasilnya sudah terkonfirmasi atau diputus admin platform.

### 7.1 Rating kekuatan club

MVP memakai Elo sederhana; Glicko dipertimbangkan setelah ada cukup data. Nilai di bawah adalah usulan awal dan dapat diatur admin platform.

```latex
E_A = \frac{1}{1 + 10^{(R_B - R_A)/400}}, \qquad R_A' = R_A + K \cdot G \cdot (S_A - E_A)
```

| Parameter             | Usulan awal                                               | Keterangan                                       |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| Rating awal club baru | 1200                                                      | Tanda "provisional" sampai 5 match terkonfirmasi |
| Faktor K              | 40 untuk 10 match pertama, lalu 24                        | Club baru bergerak lebih cepat                   |
| Hasil S               | Menang 1, seri 0,5, kalah 0                               | Per format dihitung terpisah                     |
| Pengali selisih gol G | 1,0 untuk selisih 1; 1,25 untuk 2; 1,5 untuk 3 atau lebih | Dibatasi agar skor besar tidak memicu lonjakan   |
| Match WO              | Dihitung terpisah dan tidak mengubah rating kekuatan      | Hanya memengaruhi skor keandalan                 |
| Match sengketa        | Tidak dihitung sampai diputus                             | Pembaruan menyusul setelah keputusan             |

Rating dihitung terpisah untuk Football 11v11 dan Mini soccer karena club yang sama bisa berbeda kekuatan di tiap format.

### 7.2 Skor keandalan

- Definisi: persentase dari 20 match terjadwal terakhir yang dijalani tanpa pembatalan sepihak di bawah 24 jam atau tidak hadir.
- Ditampilkan sebagai "Baru" sampai club punya minimal 5 match terjadwal.
- Penundaan yang disetujui kedua pihak dan pembatalan karena cuaca dengan bukti tidak mengurangi skor.
- Skor di bawah 60% memunculkan peringatan di profil dan di layar tantangan.

### 7.3 Penilaian sportivitas

- Skala 1 sampai 5 untuk sportivitas dan kerapian, plus komentar singkat maksimal 200 karakter.
- Penilaian saling tersembunyi sampai keduanya mengisi atau 7 hari berlalu.
- Tampil di profil sebagai rata-rata 10 penilaian terakhir; komentar bisa dilaporkan dan dimoderasi.

### 7.4 Anti-manipulasi

| Pola                                              | Deteksi                                                                                    | Tindakan                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Dua club saling "mengalah" untuk menaikkan rating | Lebih dari 3 match antar pasangan club yang sama dalam 30 hari, atau pola skor tidak wajar | Match berikutnya diabaikan dari rating; pasangan ditandai untuk ditinjau |
| Club baru dengan lonjakan rating tidak wajar      | Kenaikan lebih dari 200 poin dalam 5 match                                                 | Antrean tinjauan admin platform                                          |
| Akun ganda untuk satu club                        | Nomor HP, perangkat, dan logo yang sama                                                    | Penangguhan dan verifikasi ulang                                         |
| Penilaian sportivitas berbalas atau diborong      | Pola 5 bintang timbal balik atau banyak 1 bintang dari satu sumber                         | Penilaian dikecualikan dari rata-rata                                    |

## 8. Fitur Pendukung: Lapangan, Pencatat, Chat & Notifikasi

Fitur pendukung ada untuk memperlancar match; di MVP hanya direktori lapangan, chat per match, dan notifikasi yang wajib.

### 8.1 Lapangan / venue

| ID   | Kebutuhan                                                                                                       | Prioritas |
| ---- | --------------------------------------------------------------------------------------------------------------- | --------- |
| V-01 | Direktori lapangan: alamat, peta, jenis (rumput alami, sintetis), harga per jam, fasilitas, foto, jam buka      | P0        |
| V-02 | Admin platform mengelola profil lapangan dan menampilkan ketersediaan slot (informasi saja, belum bisa dipesan) | P0        |
| V-03 | Ulasan lapangan oleh admin club setelah match, dan laporan masalah (lampu mati, lapangan basah)                 | P1        |
| V-04 | Booking slot langsung dari match terkonfirmasi, DP atau pelunasan lewat aplikasi                                | P1        |
| V-05 | Verifikasi venue oleh admin platform                                                                            | P1        |

### 8.2 Pencatat pertandingan

| ID   | Kebutuhan                                                                                          | Prioritas |
| ---- | -------------------------------------------------------------------------------------------------- | --------- |
| W-01 | Salah satu Admin club peserta menjadi satu-satunya pencatat aktif setelah kedua club check-in      | P0        |
| W-04 | Antarmuka pencatat: skor per babak, babak aktif, penyimpanan draf offline dan konflik sinkronisasi | P0        |

Direktori, pemesanan, penilaian, serta akun wasit tidak masuk cakupan produk ini. W-02 dan W-03 dari draf awal dicabut.

### 8.3 Komunikasi

- **Chat per match** antara kedua admin, dibuat otomatis saat tantangan diterima atau tawar balik dimulai (P0).
- Pesan sistem otomatis untuk perubahan status, jadwal, dan kesiapan; tidak bisa dihapus (P0).
- Berbagi lokasi dan tautan peta di chat (P0).
- Pelaporan pesan dan pemblokiran pengguna, serta filter kata kasar (P0).
- Chat ditutup 7 hari setelah match berstatus Selesai, tetap bisa dibaca admin platform untuk sengketa (P0).

### 8.4 Notifikasi

| Pemicu                                                | Penerima                   | Kanal                     | Prioritas |
| ----------------------------------------------------- | -------------------------- | ------------------------- | --------- |
| Tantangan baru, diterima, ditolak, atau tawar balik   | Admin club terkait         | Push, dalam aplikasi      | P0        |
| Usulan atau perubahan jadwal dan lapangan             | Kedua admin                | Push, dalam aplikasi      | P0        |
| Pengingat match H-3, H-1, dan 2 jam                   | Kedua admin                | Push, WhatsApp (opsional) | P0        |
| Lawan menandai belum siap atau mengubah jumlah pemain | Admin lawan                | Push                      | P0        |
| Undangan skuad, pengingat match H-1 dan 2 jam, hasil match | Pemain                     | Push, dalam aplikasi      | P0        |
| Permintaan konfirmasi hasil dan pengingat tenggat     | Kedua admin                | Push                      | P0        |
| Hasil dikonfirmasi, rating berubah                    | Kedua admin                | Push, dalam aplikasi      | P0        |
| Sengketa dibuka dan keputusan admin platform          | Kedua admin                | Push, email               | P0        |
| Status registrasi club                                | Admin club                 | Push, email               | P0        |
| Pembayaran dan booking                                | Admin club, Admin platform | Push, email               | P1        |

Admin dapat mengatur preferensi kanal dan jam senyap; notifikasi sengketa dan pengingat 2 jam tetap dikirim.

## 9. Panel Admin Platform & Penanganan Sengketa

Admin platform memutus sengketa dalam 3 hari kerja dan memverifikasi club; semua tindakan tercatat di log audit.

### 9.1 Panel admin (P0 dasar)

| Area              | Fitur                                                                                 | Prioritas |
| ----------------- | ------------------------------------------------------------------------------------- | --------- |
| Dasbor            | Jumlah club, match per status, sengketa terbuka, antrean registrasi, laporan pengguna | P0        |
| Verifikasi        | Antrean registrasi club: setujui atau tolak dengan alasan; verifikasi lapangan        | P0        |
| Sengketa          | Antrean dengan bukti kedua pihak, riwayat chat, keputusan dan alasan tercatat         | P0        |
| Moderasi          | Peringatan, penangguhan, pemblokiran akun club; tinjau laporan konten                 | P0        |
| Konfigurasi       | Parameter rating, tenggat konfirmasi, kebijakan pembatalan, batas match terbuka       | P0        |
| Dukungan          | Cari club atau pengguna, lihat riwayat match, koreksi data dengan alasan              | P0        |
| Log audit         | Setiap tindakan admin: siapa, kapan, apa, alasan                                      | P0        |
| Impor/ekspor data | Ekspor laporan match dan club                                                         | P1        |

### 9.2 Alur sengketa

1. Sengketa terbuka otomatis bila skor kedua admin berbeda, atau satu pihak menyanggah skor dalam tenggat 48 jam.
2. Kedua pihak mendapat 48 jam untuk melampirkan bukti: foto papan skor, video, atau tangkapan layar pencatat.
3. Admin platform meninjau bukti, riwayat chat, catatan skor per babak, dan data check-in.
4. Admin memutus dalam 3 hari kerja sejak bukti lengkap; keputusan dan alasan dikirim ke kedua pihak.
5. Hasil akhir memperbarui rating dan head-to-head; match kembali ke status Selesai.

### 9.3 Opsi keputusan

| Keputusan                              | Dampak                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| Skor pengusul disahkan                 | Rating dihitung memakai skor tersebut; penyanggah tanpa bukti mendapat catatan        |
| Skor penyanggah disahkan               | Rating dihitung memakai skor tersebut                                                 |
| Skor dikoreksi admin berdasarkan bukti | Rating dihitung memakai skor koreksi                                                  |
| Match dibatalkan dari catatan          | Tidak ada pembaruan rating; kedua pihak diberi tahu                                   |
| Sanksi tambahan                        | Peringatan, penurunan skor keandalan, atau penangguhan bila terbukti memalsukan bukti |

- Pihak yang tidak puas dapat mengajukan banding satu kali dalam 3 hari; ditinjau admin platform lain (P1).
- Sengketa yang terjadi lebih dari 5% dari match selesai dalam sebulan memicu tinjauan kebijakan.

## 10. Aturan Bisnis & Monetisasi

MVP gratis sepenuhnya; pendapatan baru dimulai di Fase 2 dari langganan dan komisi booking. Angka di tabel aturan adalah ketentuan awal dan dapat diatur admin platform.

### 10.1 Aturan inti

| Aturan                       | Ketentuan awal                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| Tantangan kedaluwarsa        | 72 jam tanpa respons, atau 24 jam sebelum jadwal bila lebih dekat                             |
| Tawar balik                  | Maksimal 3 putaran; tiap putaran 72 jam atau sampai 24 jam sebelum jadwal                     |
| Match terbuka aktif per club | Maksimal 3                                                                                    |
| Konfirmasi hasil             | 48 jam setelah peluit akhir; tanpa respons, skor pengusul dianggap sah                        |
| Pembatalan sepihak           | Di bawah 24 jam sebelum kick-off menurunkan skor keandalan                                    |
| WO (tidak hadir)             | Toleransi 20 menit; kemenangan administratif 3-0 bagi club yang hadir dan check-in            |
| Kedua club tidak hadir       | Match berstatus Dibatalkan tanpa pemenang; keduanya mendapat penalti keandalan                |
| Batas pemain                 | Minimum 8 (Football 11v11), 5 (Mini soccer)                                                   |
| Rating kekuatan              | Hanya dari match terkonfirmasi; WO tidak mengubah rating                                      |
| Anti-manipulasi              | Lihat bagian 7.4                                                                              |
| Usia admin club              | Minimal 17 tahun; club anak dan SSB di luar cakupan MVP                                       |
| Perilaku                     | Kekerasan atau pelanggaran serius di lapangan yang dilaporkan dapat berujung penangguhan club |

### 10.2 Monetisasi bertahap

| Sumber                  | Model                                                                                       | Fase   |
| ----------------------- | ------------------------------------------------------------------------------------------- | ------ |
| Gratis dasar            | Match, profil club, skor, rating, statistik club                                            | MVP    |
| Club Pro                | Langganan bulanan: statistik club lanjutan, riwayat tak terbatas, tanpa iklan, banyak skuad | Fase 2 |
| Komisi booking lapangan | Persentase dari booking dan pembayaran lewat aplikasi                                       | Fase 2 |
| Sponsor dan iklan lokal | Slot di halaman club dan hasil match                                                        | Fase 3 |

Fase 3 turnamen dan marketplace dibahas setelah fase pemain dan tidak dimasukkan dalam PRD ini.

## 11. Model Data & Kasus Tepi

Model data MVP berpusat pada **Match** yang menghubungkan dua **Club**; tidak ada entitas pemain, hanya angka jumlah pemain siap di tiap sisi match.

### 11.1 Entitas utama

| Entitas          | Atribut penting                                                                          | Relasi                       |
| ---------------- | ---------------------------------------------------------------------------------------- | ---------------------------- |
| Akun             | id, peran, nomor HP atau email, status                                                   | Satu akun admin ke satu Club; akun pemain ke satu Pemain |
| Pemain           | id akun, nama, foto, posisi, kaki dominan, area                                          | Satu Akun; satu keanggotaan aktif |
| Keanggotaan Skuad | pemain, club, status (diundang, diajukan, aktif, keluar), waktu                         | Banyak per Club |
| Konfirmasi Ikut  | pemain, match, jawaban (ikut, tidak, ragu), waktu diubah                                 | Satu per Pemain per Match |
| Club             | nama, logo, area, level, status registrasi, rating per format, skor keandalan            | Satu admin; banyak Match     |
| Match            | format, status, jadwal, lapangan, biaya lapangan, pembuat, tipe (terbuka atau tantangan) | Dua Club; satu Venue         |
| Usulan Jadwal    | opsi waktu, pengusul, status (menunggu, dipilih, ditolak)                                | Banyak per Match             |
| Kesiapan         | jumlah pemain siap, tanda siap, waktu diubah                                             | Satu per Club per Match      |
| Check-in         | club, waktu, koordinat (opsional)                                                        | Dua per Match                |
| Catatan Skor     | babak, skor tiap sisi, pencatat, waktu, status sinkron                                   | Banyak per Match             |
| Konfirmasi Hasil | skor akhir, pengusul, respons lawan, waktu                                               | Satu per Match               |
| Sengketa         | bukti tiap pihak, keputusan, alasan, pemutus                                             | Nol atau satu per Match      |
| Penilaian        | sportivitas, kerapian, komentar, tersembunyi sampai kedua pihak mengisi                  | Dua per Match                |
| Riwayat Rating   | rating sebelum dan sesudah, selisih, match asal                                          | Banyak per Club per format   |
| Venue            | nama, alamat, koordinat, format, harga, jam buka, kontak, pengelola (Admin platform)     | Banyak Match                 |
| Chat dan Pesan   | pesan, pengirim, jenis (manusia atau sistem)                                             | Satu per Match               |
| Notifikasi       | pemicu, penerima, kanal, status kirim                                                    | Banyak per Akun              |
| Log Audit        | pelaku, tindakan, sasaran, waktu, alasan                                                 | Seluruh perubahan penting    |

### 11.2 Kasus tepi

| Situasi                                                            | Perilaku yang diinginkan                                                                  |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Dua tantangan ke club yang sama dalam waktu berdekatan             | Tantangan kedua ditolak otomatis dengan pesan; opsi mengubah tantangan pertama            |
| Dua club menerima match terbuka yang sama                          | Match pertama yang diterima menang; penerima lain mendapat pemberitahuan                  |
| Pencatat skor kehilangan sinyal di tengah match                    | Skor tersimpan lokal dan tersinkron saat koneksi kembali; konflik ditandai untuk ditinjau |
| Admin tidak bisa dihubungi menjelang match                         | Pengingat otomatis; pembatalan sepihak mendadak tercatat sebagai penalti                  |
| Hanya satu club check-in dalam 20 menit                            | WO untuk yang tidak hadir, kemenangan 3-0 bagi yang hadir                                 |
| Jumlah pemain siap turun di bawah batas setelah club ditandai siap | Tanda siap dicabut otomatis dan lawan diberi tahu                                         |
| Kedua admin mengonfirmasi skor berbeda                             | Sengketa otomatis                                                                         |
| Admin menyanggah tetapi tidak melampirkan bukti dalam 48 jam       | Skor pengusul disahkan                                                                    |
| Hujan atau lapangan tidak bisa dipakai di hari H                   | Penundaan tanpa penalti dengan persetujuan kedua pihak; batas jadwal ulang 14 hari        |
| Admin menghapus akun setelah punya riwayat match                   | Data pribadi dihapus; hasil match tetap tersimpan tanpa identitas pribadi                 |
| Club ditangguhkan saat punya match terjadwal                       | Match terjadwal dibatalkan tanpa penalti bagi lawan                                       |
| Pemain mengubah RSVP kurang dari 2 jam sebelum kick-off            | Ditolak; Admin club dapat menyesuaikan jumlah siap secara manual                          |
| Jumlah Ikut turun di bawah batas setelah club ditandai siap        | Tanda siap dicabut otomatis dan lawan diberi tahu (sama dengan aturan batas pemain)      |
| Pemain keluar atau dikeluarkan dari skuad                          | RSVP match mendatang dihapus; hasil match lama tetap tersimpan                            |

## 12. Non-Fungsional, Metrik & Analitik

### 12.1 Kebutuhan non-fungsional

| Kategori        | Kebutuhan                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Kinerja         | Layar utama ditargetkan muncul di bawah 2 detik pada 4G; tidak ada SLA live score                         |
| Ketersediaan    | Target 99,5% uptime; pencatat skor bekerja offline dan sinkron otomatis                                   |
| Skalabilitas    | 50.000 pengguna aktif bulanan dan 500 match bersamaan saat puncak akhir pekan                             |
| Perangkat       | Web responsif: desktop dan browser mobile; aplikasi native tidak masuk implementasi ini                   |
| Bahasa          | Bahasa Indonesia dahulu; struktur teks siap multibahasa                                                   |
| Keamanan        | OTP berlapis, token berumur pendek, enkripsi dalam perjalanan dan penyimpanan, batas laju, log audit      |
| Privasi         | Mengikuti UU PDP: persetujuan eksplisit, hak hapus akun, minimisasi data lokasi (GPS hanya saat check-in) |
| Pembayaran      | Penyedia berlisensi saat Fase 2; aplikasi tidak menyimpan data kartu                                      |
| Aksesibilitas   | Ukuran teks dapat diubah, kontras memadai, label untuk pembaca layar                                      |
| Integritas data | Catatan skor dan keputusan tidak bisa dihapus, hanya dikoreksi dengan riwayat                             |

### 12.2 Metrik keberhasilan

| Metrik                   | Definisi                                       | Target awal                     |
| ------------------------ | ---------------------------------------------- | ------------------------------- |
| Match selesai per minggu | Match berstatus Selesai                        | 200 di bulan ke-3 di kota pilot |
| Konversi tantangan       | Tantangan diterima / tantangan dikirim         | Minimal 50%                     |
| Waktu menuju konfirmasi  | Median dari tantangan sampai Terkonfirmasi     | Di bawah 48 jam                 |
| Tingkat penyelesaian     | Match terkonfirmasi yang berakhir dengan hasil | Minimal 70%                     |
| Tingkat sengketa         | Match sengketa / match selesai                 | Maksimal 5%                     |
| Tingkat WO               | Match WO / match terkonfirmasi                 | Maksimal 5%                     |
| Retensi club             | Club yang main lagi dalam 30 hari              | Minimal 40%                     |
| Club aktif bulanan       | Club dengan minimal 1 match per bulan          | 500 di bulan ke-6               |
| NPS admin club           | Survei triwulanan                              | Minimal 40                      |

### 12.3 Analitik

Peristiwa yang dilacak dengan persetujuan pengguna: registrasi club diajukan dan disetujui, match terbuka dibuat, tantangan dikirim, diterima, ditolak, tawar balik, jadwal terkonfirmasi, club siap, check-in, skor dicatat, hasil dikonfirmasi, sengketa dibuka dan diputus, penilaian diisi, rematch diajukan. Setiap peristiwa membawa id match dan id club, tanpa data pribadi.

## 13. Roadmap, Fitur Ditunda, Risiko & Pertanyaan Terbuka

### 13.2 Fitur ditunda ke fase pemain dan setelahnya

Fitur berikut sengaja tidak masuk MVP karena unit produk adalah club; mereka dibangun di atas data match yang sudah dipercaya.

| Kelompok       | Fitur                                                              | Alasan ditunda                                            | Fase |
| -------------- | ------------------------------------------------------------------ | --------------------------------------------------------- | ---- |
| Pemain         | Statistik karier, kartu pemain, riwayat banyak club | Profil dasar dan skuad sudah di MVP; statistik butuh pencatatan per pemain | 3    |
| Skuad          | Lineup, formasi, guest player, absensi latihan | Match MVP cukup dengan RSVP dan jumlah pemain siap                 | 3    |
| Detail match   | Pencetak gol, assist, kartu, pergantian, MVP match                 | Bergantung pada data pemain                               | 3    |
| Manajemen club | Kalender latihan, kas club, inventaris, chat grup club             | Bernilai setelah anggota club ada di aplikasi             | 3    |
| Perekrutan     | Lowongan posisi, pemain lepas, rating individu, cedera             | Butuh basis pemain                                        | 3    |
| Turnamen       | Seri sparring penuh, sistem gugur, grup, klasemen, sanksi kartu    | Butuh volume match dan data stabil                        | 2-3  |
| Sosial         | Feed, suporter, prediksi skor, komentar                            | Bukan inti nilai MVP                                      | 2-3  |
| Konten         | Highlight video, statistik lanjutan, gamifikasi                    | Butuh input terperinci                                    | 3    |
| Ekonomi        | Marketplace, sponsor, API penyelenggara                            | Butuh basis pengguna besar                                | 3    |

### 13.3 Risiko utama

| Risiko                                       | Dampak                    | Mitigasi                                                                   |
| -------------------------------------------- | ------------------------- | -------------------------------------------------------------------------- |
| Ayam dan telur: tidak ada lawan di kota baru | Match tidak terjadi       | Pilot satu kota padat; rekrut club inti dan komunitas terlebih dahulu      |
| Sengketa skor dan kecurangan rating          | Kepercayaan turun         | Konfirmasi dua pihak, bukti foto, deteksi pola, keputusan admin            |
| Pembatalan sepihak dan WO                    | Pengalaman buruk          | Skor keandalan, tenggat, pengingat, penalti                                |
| Admin tunggal tidak responsif                | Konfirmasi hasil macet    | Tenggat otomatis 48 jam; opsi wakil admin dipertimbangkan setelah MVP      |
| Perselisihan atau kekerasan di lapangan      | Citra dan hukum           | Aturan perilaku, laporan, penangguhan, panduan keselamatan                 |
| Ketergantungan pada WhatsApp                 | Adopsi lambat             | Bagikan tautan ke WhatsApp; jadikan aplikasi "catatan resmi"               |
| Beban verifikasi club manual                 | Antrean registrasi lambat | Target waktu setujui 1 hari kerja; alat bantu admin dan batas kuota harian |
| Regulasi pembayaran dan data pribadi         | Penundaan peluncuran      | Penyedia berlisensi; tinjauan hukum sebelum Fase 2                         |

### 13.4 Pertanyaan terbuka

- [ ] Kota pilot pertama dan target jumlah club awalnya?
- [x] Format: Football (11v11) dan Mini soccer saja.
- [x] Platform awal: web responsif dengan Next.js.
- [ ] Ada tim engineering internal, atau pengembangan dialihdayakan?
- [ ] Anggaran dan target waktu rilis MVP?
- [ ] Alur dan dokumen sesi registrasi club: dokumen apa yang diminta, tatap muka atau daring?
- [ ] Siapa yang memutus sengketa di awal: tim internal atau relawan komunitas?
- [x] Pencatat skor adalah salah satu Admin club peserta; tidak ada akun pencatat independen.
- [ ] Club anak dan SSB: masuk cakupan atau tidak?
- [ ] Apakah satu orang boleh mengelola lebih dari satu club (kebijakan satu akun satu club)?
- [x] Pemain punya akun terbatas: profil, skuad, dan RSVP.
- [ ] Boleh satu pemain berada di lebih dari satu club? (asumsi MVP: satu club aktif)

## 14. Implementasi dan sumber acuan

- [Design system](DESIGN.md): token, aturan komponen, aset logo dan maskot, halaman referensi.
- [Peta codebase](CODEBASE.md): struktur file, aliran data, autentikasi, dan aturan perubahan.
- [Status implementasi](STATUS.md): fitur tersedia, keterbatasan, serta pekerjaan tersisa.
- [Database dan migrasi Supabase](DATABASE.md): skema SQLite dan rencana transisi.
- [Cara menjalankan dan verifikasi](DEVELOPMENT.md): environment, akun demo, provisioning admin, dan pengujian.

Keputusan ruang lingkup di bagian 1–2 revisi ini mengungguli draf awal di root repository. Statistik karier pemain, lineup, booking, pembayaran, dan fitur di luar dua format/tiga peran tidak ditambahkan.
