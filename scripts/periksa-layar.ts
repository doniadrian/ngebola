// Cek tampilan & alur di browser sungguhan (Edge/Chrome terpasang, lewat playwright-core).
// Pakai: jalankan `npm run dev`, lalu `npm run periksa` (DEV_LOG=path log dev server untuk tautan reset).
// Hasil: tangkapan layar di screens/<lebar>/, ringkasan error konsol & geser horizontal di terminal.
import { mkdirSync, readFileSync } from "node:fs";
import { chromium, type Browser, type Page } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PW = "ngebola-demo-123";
const LAYAR = [
  { nama: "390", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { nama: "1280", viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false },
];
const masalah: string[] = [];

async function buka(browser: Browser, layar: (typeof LAYAR)[number]) {
  const ctx = await browser.newContext({ viewport: layar.viewport, isMobile: layar.isMobile, hasTouch: layar.hasTouch, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && masalah.push(`[${layar.nama}] console: ${m.text().slice(0, 200)}`));
  page.on("pageerror", (e) => masalah.push(`[${layar.nama}] pageerror: ${e.message}`));
  page.on("response", (r) => r.status() >= 500 && masalah.push(`[${layar.nama}] HTTP ${r.status()} ${r.url()}`));
  return { ctx, page };
}

async function foto(page: Page, layar: string, nama: string) {
  await page.waitForLoadState("networkidle").catch(() => {});
  const lebar = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (lebar > 0) masalah.push(`[${layar}] ${nama}: geser horizontal ${lebar}px`);
  mkdirSync(`screens/${layar}`, { recursive: true });
  await page.screenshot({ path: `screens/${layar}/${nama}.png`, fullPage: true });
}

async function masuk(page: Page, email: string, password = PW) {
  await page.goto(`${BASE}/masuk`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/masuk"), { timeout: 30000 }), page.getByRole("button", { name: "Masuk" }).click()]);
}

async function keluar(page: Page) {
  await page.getByRole("button", { name: "Keluar" }).first().click();
  await page.waitForURL("**/masuk", { timeout: 30000 });
}

function cek(kondisi: boolean, pesan: string) {
  if (!kondisi) masalah.push(`ALUR: ${pesan}`);
  else console.info(`  ✓ ${pesan}`);
}

async function main() {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "msedge" });

  for (const layar of LAYAR) {
    const { ctx, page } = await buka(browser, layar);
    for (const [path, nama] of [
      ["/", "beranda"], ["/masuk", "masuk"], ["/daftar", "daftar"], ["/lupa-password", "lupa"], ["/jelajahi", "jelajahi"], ["/leaderboard", "leaderboard"],
      ["/profil-club/lancang-kuning-fc", "profil-club"], ["/syarat-layanan", "syarat-layanan"], ["/kebijakan-privasi", "kebijakan-privasi"], ["/reset-password/token-palsu", "reset-tidak-berlaku"], ["/undangan/token-palsu", "undangan-tidak-berlaku"], ["/dev/komponen", "komponen"],
    ]) {
      await page.goto(`${BASE}${path}`);
      await foto(page, layar.nama, nama);
    }
    for (const [email, dasar, tabs] of [
      ["club@ngebola.test", "/club", ["jadwal", "cari-lawan", "skuad", "profil", "notifikasi"]],
      ["pemain@ngebola.test", "/pemain", ["jadwal", "peringkat", "skuad", "profil"]],
      ["admin@ngebola.test", "/platform", ["verifikasi", "sengketa", "lapangan", "lainnya"]],
    ] as const) {
      await masuk(page, email);
      cek(new URL(page.url()).pathname === dasar, `[${layar.nama}] ${email} masuk → ${dasar}`);
      await foto(page, layar.nama, `${dasar.slice(1)}-beranda`);
      for (const t of tabs) {
        await page.goto(`${BASE}${dasar}/${t}`);
        await foto(page, layar.nama, `${dasar.slice(1)}-${t}`);
      }
      // Peran lain tidak boleh membuka area ini.
      const lain = dasar === "/club" ? "/platform" : "/club";
      await page.goto(`${BASE}${lain}`);
      cek(new URL(page.url()).pathname === dasar, `[${layar.nama}] ${email} membuka ${lain} diarahkan ke ${dasar}`);
      if (layar.isMobile) await page.goto(`${BASE}${dasar}/${tabs.at(-1) === "notifikasi" ? "profil" : tabs.at(-1)}`);
      await keluar(page);
      await page.goto(`${BASE}${dasar}`);
      cek(new URL(page.url()).pathname === "/masuk", `[${layar.nama}] setelah keluar, ${dasar} → /masuk`);
    }
    await ctx.close();
  }

  // Alur penuh di HP: daftar → keluar → lupa password → reset → masuk dengan password baru.
  console.info("Alur akun baru (390 px):");
  const { ctx, page } = await buka(browser, LAYAR[0]);
  const email = `uji.${Date.now()}@contoh.id`;
  await page.goto(`${BASE}/daftar`);
  // Peran Pemain ditahan: pendaftaran otomatis Admin club (tanpa pilihan peran).
  await page.getByLabel("Nama lengkap").fill("Uji Coba");
  await page.getByLabel("Email").fill(email);
  await page.locator("#birthDate").click();
  await page.getByRole("combobox").nth(1).selectOption("1995").catch(() => {});
  await page.locator("[role=gridcell] button:not([disabled])").first().click();
  await page.getByLabel("Password", { exact: true }).fill("password-uji-123");
  await page.getByLabel("Ulangi password").fill("password-uji-123");
  // Persetujuan wajib: tanpa dicentang, daftar ditolak.
  await page.getByRole("button", { name: "Buat Akun" }).click();
  cek(await page.getByText("Centang persetujuan untuk melanjutkan.").waitFor({ timeout: 10000 }).then(() => true, () => false), "daftar tanpa persetujuan ditolak");
  cek(new URL(page.url()).pathname === "/daftar", "tetap di halaman daftar");
  await page.getByRole("checkbox").click();
  // Password dikosongkan setelah galat (standar keamanan); isi lagi.
  await page.getByLabel("Password", { exact: true }).fill("password-uji-123");
  await page.getByLabel("Ulangi password").fill("password-uji-123");
  // Tombol tampil/sembunyi tidak mengirim form dan tidak menghapus isi.
  await page.getByRole("button", { name: "Tampilkan password" }).first().click();
  cek((await page.getByLabel("Password", { exact: true }).getAttribute("type")) === "text", "toggle menampilkan password");
  cek((await page.getByLabel("Password", { exact: true }).inputValue()) === "password-uji-123", "toggle tidak menghapus isi");
  cek(new URL(page.url()).pathname === "/daftar", "toggle tidak mengirim form");
  await foto(page, "390", "alur-daftar-terisi");
  await Promise.all([page.waitForURL("**/club", { timeout: 30000 }), page.getByRole("button", { name: "Buat Akun" }).click()]);
  cek(new URL(page.url()).pathname === "/club", "daftar Admin club → /club");
  await page.goto(`${BASE}/club/profil`);
  await keluar(page);

  await page.goto(`${BASE}/lupa-password`);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Kirim Tautan" }).click();
  await page.getByText("Cek kotak masukmu").waitFor();
  await foto(page, "390", "alur-lupa-terkirim");
  const log = process.env.DEV_LOG ? readFileSync(process.env.DEV_LOG, "utf8") : "";
  const tautan = [...log.matchAll(/https?:\/\/\S+\/reset-password\/[A-Za-z0-9_-]+/g)].at(-1)?.[0];
  cek(!!tautan, "tautan reset tercetak di terminal (mode demo)");
  if (tautan) {
    await page.goto(tautan);
    await page.getByLabel("Password baru", { exact: true }).fill("password-baru-456");
    await page.getByLabel("Ulangi password baru").fill("password-baru-456");
    await foto(page, "390", "alur-reset-form");
    await Promise.all([page.waitForURL("**/masuk?reset=berhasil", { timeout: 30000 }), page.getByRole("button", { name: "Simpan Password" }).click()]);
    await foto(page, "390", "alur-reset-berhasil");
    await masuk(page, email, "password-baru-456");
    cek(new URL(page.url()).pathname === "/club", "masuk dengan password baru");
    await page.goto(tautan);
    cek((await page.getByText("Tautan sudah kedaluwarsa atau sudah dipakai").count()) > 0, "tautan reset hanya sekali pakai");
  }
  await ctx.clearCookies();
  await page.goto(`${BASE}/masuk`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("salah-sekali");
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.getByText("Email atau password salah.").waitFor();
  await foto(page, "390", "alur-masuk-salah");

  // Fase 2: registrasi club → verifikasi → pemain gabung lewat kode → disetujui.
  console.info("Alur club & skuad (390 px):");
  await ctx.clearCookies();
  await masuk(page, email, "password-baru-456");
  await page.goto(`${BASE}/club/daftar-club`);
  const namaClub = `Club Uji ${Date.now() % 100000}`;
  await page.getByLabel("Nama club").fill(namaClub);
  await page.locator("#area").click();
  await page.getByRole("option", { name: "Senapelan" }).click();
  await page.getByText("Menengah", { exact: true }).click();
  await page.getByLabel("Nomor HP pengurus").fill("0812 3456 7890");
  await foto(page, "390", "alur-daftar-club");
  await Promise.all([page.waitForURL("**/club?registrasi=diajukan", { timeout: 30000 }), page.getByRole("button", { name: "Kirim untuk Verifikasi" }).click()]);
  cek((await page.getByText("Menunggu verifikasi").count()) > 0, "club terdaftar dengan status Menunggu verifikasi");
  await foto(page, "390", "alur-club-diajukan");

  await ctx.clearCookies();
  await masuk(page, "admin@ngebola.test");
  await page.goto(`${BASE}/platform/verifikasi`);
  await foto(page, "390", "platform-verifikasi");
  const kartu = page.locator("li", { hasText: namaClub });
  await kartu.getByRole("button", { name: "Setujui" }).click();
  await page.getByText(`${namaClub} disetujui`).waitFor();
  cek(true, "Admin platform menyetujui club");

  await ctx.clearCookies();
  await masuk(page, email, "password-baru-456");
  await page.goto(`${BASE}/club/skuad`);
  const kode = (await page.locator("p.font-mono").first().innerText()).trim();
  cek(/^[A-Z0-9]{6}$/.test(kode), `kode skuad tampil (${kode})`);
  await page.getByRole("button", { name: "Buat Tautan Undangan" }).click();
  await page.getByText("/undangan/").waitFor();
  await foto(page, "390", "club-skuad-undangan");

  await ctx.clearCookies();
  await masuk(page, "pemain.baru@ngebola.test");
  await page.goto(`${BASE}/pemain/skuad`);
  await page.getByLabel("Kode skuad").fill(kode);
  await page.getByRole("button", { name: "Minta Gabung" }).click();
  await page.getByText(`Menunggu persetujuan ${namaClub}`).waitFor();
  cek(true, "pemain minta gabung lewat kode → menunggu persetujuan");
  await foto(page, "390", "pemain-skuad-menunggu");

  await ctx.clearCookies();
  await masuk(page, email, "password-baru-456");
  await page.goto(`${BASE}/club`);
  cek((await page.getByText("Permintaan gabung skuad").count()) > 0, "permintaan muncul di Perlu Anda lakukan");
  await foto(page, "390", "club-beranda-tugas");
  await page.goto(`${BASE}/club/skuad`);
  await page.getByRole("button", { name: "Setujui Yudi Saputra" }).click();
  await page.getByText("Yudi Saputra masuk skuad").waitFor();
  cek(true, "admin club menyetujui pemain");

  await ctx.clearCookies();
  await masuk(page, "pemain.baru@ngebola.test");
  await page.goto(`${BASE}/pemain/skuad`);
  cek((await page.getByText(namaClub).count()) > 0, "pemain melihat club di tab Skuad");
  await foto(page, "390", "pemain-skuad-aktif");
  await page.goto(`${BASE}/profil-club/lancang-kuning-fc`);
  cek((await page.getByText("Yudi Saputra").count()) === 0 && (await page.getByText("Rizky Akbar").count()) === 0, "profil club publik tanpa data pemain");

  // Fase 3: match terbuka, tantangan, tawar balik, chat, RSVP.
  console.info("Alur match (390 px):");
  await ctx.clearCookies();
  await masuk(page, "club@ngebola.test");
  await page.goto(`${BASE}/club/jadwal`);
  await foto(page, "390", "club-jadwal");
  await page.goto(`${BASE}/club/cari-lawan`);
  await foto(page, "390", "club-cari-lawan");
  await page.getByRole("link", { name: "Lihat & Terima" }).first().click();
  await page.waitForURL("**/club/match/**");
  await foto(page, "390", "club-match-terbuka");
  await page.locator("[role=radio]").first().click();
  await page.getByRole("button", { name: "Terima Sparring" }).click();
  await page.getByText("Sparring diterima!").waitFor();
  cek(await page.getByText("Kesiapan Lancang Kuning FC").waitFor({ timeout: 15000 }).then(() => true, () => false), "Lancang menerima match terbuka → terkonfirmasi");
  await page.goto(`${BASE}/club/cari-lawan?tab=club`);
  await foto(page, "390", "club-cari-lawan-club");

  await page.goto(`${BASE}/club/match/baru`);
  await page.locator("#tanggal_0").click();
  await page.locator("[role=gridcell] button:not([disabled])").nth(2).click();
  await page.locator("#venueId").click();
  await page.getByRole("option").first().click();
  await page.locator("#feeTotal").fill("450000");
  await foto(page, "390", "club-match-baru");
  await Promise.all([page.waitForURL("**/club/match/**?baru=1", { timeout: 30000 }), page.getByRole("button", { name: "Terbitkan Match Terbuka" }).click()]);
  cek((await page.getByText("Match terbuka terbit").count()) > 0, "membuat match terbuka baru");

  // Marpoyan menawar balik tantangan dari Lancang, lalu Lancang menerima tawaran.
  await ctx.clearCookies();
  await masuk(page, "marpoyan@ngebola.test");
  await page.goto(`${BASE}/club/jadwal?tab=masuk`);
  await page.getByRole("link", { name: /Lancang Kuning FC/ }).first().click();
  await page.waitForURL("**/club/match/**");
  await page.getByRole("button", { name: "Tawar" }).click();
  await page.locator("#tanggal_0").click();
  await page.locator("[role=gridcell] button:not([disabled])").nth(1).click();
  await page.locator("#venueId").click();
  await page.getByRole("option").first().click();
  await foto(page, "390", "club-tawar-sheet");
  await page.getByRole("button", { name: "Kirim Tawaran" }).click();
  await page.getByText("Tawaran terkirim").first().waitFor();
  const urlTawar = page.url();
  cek(true, "Marpoyan menawar balik");

  await ctx.clearCookies();
  await masuk(page, "club@ngebola.test");
  await page.goto(urlTawar);
  await page.locator("[role=radio]").first().click();
  await page.getByRole("button", { name: "Terima Sparring" }).click();
  await page.getByText("Sparring diterima!").waitFor();
  cek(true, "Lancang menerima tawaran balik → terkonfirmasi");
  await page.getByLabel("Tulis pesan").fill("Siap, sampai ketemu di lapangan!");
  await page.getByRole("button", { name: "Kirim pesan" }).click();
  await page.getByText("Siap, sampai ketemu di lapangan!").waitFor();
  cek(true, "chat match terkirim");
  await foto(page, "390", "club-match-terkonfirmasi");

  await ctx.clearCookies();
  await masuk(page, "pemain@ngebola.test");
  await foto(page, "390", "pemain-beranda");
  cek((await page.getByText("Konfirmasi ditutup 2 jam sebelum kick-off").count()) > 0, "RSVP match hari H terkunci (< 2 jam)");
  await page.goto(`${BASE}/pemain/jadwal`);
  await page.getByRole("link", { name: /vs Garuda Sail FC/ }).first().click();
  await page.waitForURL("**/pemain/match/**");
  await page.getByRole("radio", { name: "Ikut" }).first().click();
  await page.getByText("Jawabanmu: Ikut").waitFor();
  cek(true, "pemain mengonfirmasi ikut");
  await page.goto(`${BASE}/pemain/jadwal`);
  await foto(page, "390", "pemain-jadwal");
  await ctx.close();

  // Fase 4: check-in → pencatat → peluit akhir → konfirmasi → penilaian; sanggah; keputusan sengketa.
  console.info("Alur hari H (390 px):");
  {
    const h = await buka(browser, LAYAR[0]);
    const p = h.page;
    await masuk(p, "club@ngebola.test");
    await p.goto(`${BASE}/club`);
    cek(await p.getByText(/Check-in vs Sukajadi United/).first().waitFor({ timeout: 10000 }).then(() => true, () => false), "tugas check-in muncul di Perlu Anda lakukan");
    await p.getByText(/Check-in vs Sukajadi United/).first().click();
    await p.waitForURL("**/club/match/**");
    const urlHariH = p.url();
    await p.getByRole("button", { name: "Check-in Sekarang" }).click();
    await p.getByText("Check-in tercatat").waitFor();
    await foto(p, "390", "club-checkin");

    await h.ctx.clearCookies();
    await masuk(p, "sukajadi@ngebola.test");
    await p.goto(urlHariH);
    await p.getByRole("button", { name: "Check-in Sekarang" }).click();
    await p.getByText("Check-in tercatat").waitFor();
    await p.getByRole("button", { name: "Mulai Match & Catat Skor" }).click();
    await p.getByText("Kick-off! Kamu pencatat skor.").waitFor();
    await p.getByRole("button", { name: "Gol untuk Sukajadi United" }).click();
    await p.getByRole("button", { name: "Gol untuk Lancang Kuning FC" }).click();
    await p.getByRole("button", { name: "Gol untuk Sukajadi United" }).click();
    await p.getByRole("button", { name: "Akhiri Babak 1" }).click();
    await p.getByRole("button", { name: "Mulai Babak 2" }).click();
    await foto(p, "390", "pencatat-skor");
    await p.getByRole("button", { name: "Peluit Akhir" }).click();
    await p.getByRole("button", { name: "Ya, Selesai" }).click();
    cek(await p.getByText("Konfirmasi hasil").first().waitFor({ timeout: 20000 }).then(() => true, () => false), "pencatat meniup peluit akhir → menunggu konfirmasi");

    await h.ctx.clearCookies();
    await masuk(p, "club@ngebola.test");
    await p.goto(urlHariH);
    await foto(p, "390", "konfirmasi-hasil");
    await p.getByRole("button", { name: "Setuju" }).click();
    await p.getByText("Hasil dikonfirmasi. Rating diperbarui.").waitFor();
    cek(await p.getByText("Hasil resmi").first().waitFor({ timeout: 15000 }).then(() => true, () => false), "Lancang mengonfirmasi hasil → Selesai");
    await p.getByRole("radio", { name: "5 dari 5" }).first().click();
    await p.getByRole("radio", { name: "4 dari 5" }).nth(1).click();
    await p.getByRole("button", { name: "Kirim Penilaian" }).click();
    await p.getByText("Penilaian tersimpan").waitFor();
    cek(true, "penilaian sportivitas terkirim");
    await foto(p, "390", "hasil-penilaian");

    // Rumbai menyanggah hasil 3-1 dari Lancang.
    await h.ctx.clearCookies();
    await masuk(p, "rumbai@ngebola.test");
    await p.goto(`${BASE}/club`);
    await p.getByText(/Konfirmasi hasil vs Lancang/).first().click();
    await p.getByRole("button", { name: "Sanggah" }).click();
    await p.getByLabel("Lancang Kuning FC").fill("2");
    await p.getByLabel("Rumbai Veteran").fill("2");
    await p.getByRole("button", { name: "Ya, Sanggah" }).click();
    await p.getByText("Sanggahan terkirim. Sengketa dibuka.").waitFor();
    await p.getByLabel("Tautan bukti").fill("https://contoh.id/video-gol");
    await p.getByLabel("Penjelasan").fill("Gol ketiga Lancang offside, terlihat di video.");
    await p.getByRole("button", { name: "Kirim Bukti" }).click();
    await p.getByText("Bukti terkirim").waitFor();
    cek(true, "Rumbai menyanggah dan melampirkan bukti");
    await foto(p, "390", "sengketa-club");
    await h.ctx.close();

    const pf = await buka(browser, LAYAR[1]);
    await masuk(pf.page, "admin@ngebola.test");
    await pf.page.goto(`${BASE}/platform/sengketa`);
    await foto(pf.page, "1280", "platform-sengketa");
    await pf.page.getByRole("link", { name: /Sukajadi United vs Marpoyan Damai FC/ }).click();
    await pf.page.getByText("Koreksi skor", { exact: true }).click();
    await pf.page.locator("#koreksi-a").fill("2");
    await pf.page.locator("#koreksi-b").fill("2");
    await pf.page.getByLabel("Alasan keputusan").fill("Video menunjukkan gol kedua Sukajadi sah, tetapi gol penyeimbang Marpoyan juga sah.");
    await foto(pf.page, "1280", "platform-sengketa-detail");
    await pf.page.getByRole("button", { name: "Simpan Keputusan" }).click();
    await pf.page.getByText("Keputusan tersimpan").waitFor();
    cek(await pf.page.getByText(/Sudah diputus: koreksi/).waitFor({ timeout: 15000 }).then(() => true, () => false), "Admin platform memutus sengketa (koreksi 2-2)");
    await pf.ctx.close();
  }

  // Fase 5: notifikasi & panel Admin platform.
  console.info("Alur notifikasi & panel platform:");
  {
    const h = await buka(browser, LAYAR[0]);
    await masuk(h.page, "club@ngebola.test");
    await h.page.goto(`${BASE}/club/notifikasi`);
    await foto(h.page, "390", "club-notifikasi");
    const sebelum = await h.page.getByText("Belum dibaca:").count();
    cek(sebelum > 0, `ada ${sebelum} pemberitahuan belum dibaca`);
    await h.page.locator("a[href^='/buka/']").first().click();
    await h.page.waitForURL((u) => !u.pathname.endsWith("/notifikasi"));
    await h.page.goto(`${BASE}/club/notifikasi`);
    cek((await h.page.getByText("Belum dibaca:").count()) === sebelum - 1, "membuka pemberitahuan menandainya dibaca");
    await h.page.getByRole("button", { name: "Tandai semua dibaca" }).click();
    cek(await h.page.getByText("Belum dibaca:").first().waitFor({ state: "detached", timeout: 15000 }).then(() => true, () => false), "tandai semua dibaca");
    await h.ctx.close();

    for (const layar of LAYAR) {
      const p = await buka(browser, layar);
      await masuk(p.page, "admin@ngebola.test");
      for (const [path, nama] of [["/platform", "platform-beranda"], ["/platform/lainnya", "platform-lainnya"], ["/platform/club", "platform-club"], ["/platform/laporan", "platform-laporan"], ["/platform/lapangan", "platform-lapangan"], ["/platform/pengguna?cari=lancang", "platform-pengguna"], ["/platform/audit", "platform-audit"], ["/platform/pengaturan", "platform-pengaturan"]]) {
        await p.page.goto(`${BASE}${path}`);
        await foto(p.page, layar.nama, nama);
      }
      if (layar.nama === "1280") {
        await p.page.goto(`${BASE}/platform/club`);
        await p.page.getByRole("link", { name: /Rumbai Veteran/ }).click();
        await foto(p.page, "1280", "platform-club-detail");
        await p.page.goto(`${BASE}/platform/lapangan`);
        await p.page.getByRole("link", { name: /Lapangan Hangtuah/ }).click();
        await p.page.getByRole("button", { name: "Tambah Slot" }).click();
        cek(await p.page.getByText(/Sabtu/).nth(3).waitFor({ timeout: 15000 }).then(() => true, () => false), "Admin platform menambah slot lapangan");
        await foto(p.page, "1280", "platform-lapangan-detail");
        await p.page.goto(`${BASE}/platform/pengaturan`);
        await p.page.getByLabel("Alasan perubahan").fill("Uji simpan pengaturan tanpa perubahan nilai.");
        await p.page.getByRole("button", { name: "Simpan Pengaturan" }).click();
        cek(await p.page.getByText("Pengaturan tersimpan").waitFor({ timeout: 15000 }).then(() => true, () => false), "pengaturan tersimpan + audit");
      }
      await p.ctx.close();
    }
  }

  // Hak hapus akun: pemain baru mendaftar lalu menghapus akunnya.
  console.info("Alur hapus akun (390 px):");
  if (process.env.FITUR_PEMAIN !== "1") console.info("  - dilewati: peran Pemain ditahan (jalankan dengan FITUR_PEMAIN=1 di server dev dan skrip)");
  if (process.env.FITUR_PEMAIN === "1") {
    const h = await buka(browser, LAYAR[0]);
    const p = h.page;
    const em = `hapus.${Date.now()}@contoh.id`;
    await p.goto(`${BASE}/daftar?peran=player`);
    await p.getByLabel("Nama lengkap").fill("Pemain Hapus");
    await p.getByLabel("Email").fill(em);
    await p.locator("#birthDate").click();
    await p.locator("[role=gridcell] button:not([disabled])").first().click();
    await p.getByLabel("Password", { exact: true }).fill("password-uji-123");
    await p.getByLabel("Ulangi password").fill("password-uji-123");
    await p.getByRole("checkbox").click();
    await foto(p, "390", "daftar-persetujuan");
    await Promise.all([p.waitForURL("**/pemain", { timeout: 30000 }), p.getByRole("button", { name: "Buat Akun" }).click()]);
    await p.goto(`${BASE}/pemain/profil`);
    await p.getByRole("button", { name: "Hapus akun" }).click();
    await p.getByLabel("Masukkan password untuk konfirmasi").fill("salah-sekali-123");
    await p.getByRole("button", { name: "Ya, Hapus Akun" }).click();
    await p.getByText("Password salah.").waitFor();
    await foto(p, "390", "hapus-akun-dialog");
    await p.getByLabel("Masukkan password untuk konfirmasi").fill("password-uji-123");
    await Promise.all([p.waitForURL("**/masuk?akun=dihapus", { timeout: 30000 }), p.getByRole("button", { name: "Ya, Hapus Akun" }).click()]);
    cek((await p.getByText("Akun dihapus").count()) > 0, "pemain menghapus akun → /masuk dengan pemberitahuan");
    await p.goto(`${BASE}/pemain`);
    cek(new URL(p.url()).pathname === "/masuk", "sesi pemain terhapus tidak bisa masuk lagi");
    await h.ctx.close();
  }

  // Desktop: detail match & jadwal.
  {
    const d = await buka(browser, LAYAR[1]);
    await masuk(d.page, "club@ngebola.test");
    await d.page.goto(`${BASE}/club/jadwal?tab=jadwal`);
    await foto(d.page, "1280", "club-jadwal");
    await d.page.goto(urlTawar);
    await foto(d.page, "1280", "club-match-terkonfirmasi");
    await d.ctx.close();
  }
  await browser.close();

  console.info(masalah.length ? `\n${masalah.length} masalah:\n${masalah.join("\n")}` : "\nTidak ada masalah ditemukan.");
  process.exit(masalah.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
