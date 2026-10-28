// Data demo: club fiksi, pemain, lapangan, match di setiap status, dan satu akun demo per peran.
// Pakai: npm run db:seed (database kosong) atau npm run db:reset (kosongkan semua tabel lalu isi ulang).
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";

const DB_PATH = process.env.DATABASE_PATH ?? "data/ngebola.db";
const reset = process.argv.includes("--reset");

export const PASSWORD_DEMO = "ngebola-demo-123";

async function main() {
  const { db, migrateDb, schema: s } = await import("@/db");
  const { hashPassword, randomCode } = await import("@/server/auth/crypto");
  const { slugify, kunciNama, inisialDari } = await import("@/lib/slug");
  const { dariWIB, tanggalWIB, HARI, JAM, MENIT } = await import("@/lib/waktu");
  const { terapkanRating } = await import("@/server/rating");
  type Format = (typeof s.matches.$inferInsert)["format"];
  type Status = (typeof s.matches.$inferInsert)["status"];

  migrateDb();
  if (reset) {
    // Kosongkan isi tabel (bukan hapus file) supaya server dev yang sedang jalan langsung melihat data baru.
    const tabel = db.all<{ name: string }>(sql`select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '__drizzle%'`);
    db.run(sql`pragma foreign_keys = off`);
    for (const t of tabel) db.run(sql.raw(`delete from "${t.name}"`));
    db.run(sql`pragma foreign_keys = on`);
  }
  if (db.select({ id: s.users.id }).from(s.users).limit(1).get()) {
    console.error("Database sudah berisi data. Jalankan `npm run db:reset` untuk mengosongkan lalu mengisi ulang.");
    process.exit(1);
  }

  const now = new Date();
  const pada = (hari: number, jam: string) => dariWIB(tanggalWIB(new Date(now.getTime() + hari * HARI)), jam);
  const geser = (ms: number) => new Date(now.getTime() + ms);
  const hash = await hashPassword(PASSWORD_DEMO);

  // ── Akun ──────────────────────────────────────────────────────────────────
  function akun(email: string, name: string, role: "club_admin" | "platform_admin" | "player", lahir = "1994-03-15") {
    const id = randomUUID();
    db.insert(s.users).values({ id, email, name, role, passwordHash: hash, birthDate: lahir, consentAt: geser(-60 * HARI), consentVersion: "2026-10", createdAt: geser(-60 * HARI), updatedAt: geser(-60 * HARI) }).run();
    if (role === "player") db.insert(s.players).values({ userId: id, avatarSeed: randomUUID(), updatedAt: geser(-60 * HARI) }).run();
    return id;
  }

  const adminPlatform = akun("admin@ngebola.test", "Sari Wulandari", "platform_admin", "1990-08-01");

  // ── Club fiksi (lambang dari referensi/Lambang.html) ──────────────────────
  const DATA_CLUB = [
    { key: "lancang", name: "Lancang Kuning FC", area: "Bukit Raya", level: "menengah", year: 2018, color: "#e3b52a", away: "#1f6b45", logo: true, admin: ["club@ngebola.test", "Dimas Pratama"], desc: "Club fun football karyawan & alumni. Main tiap Sabtu malam, terbuka untuk sparring mini soccer maupun 11v11." },
    { key: "garuda", name: "Garuda Sail FC", area: "Sail", level: "mahir", year: 2015, color: "#1f4e8c", away: "#f2ede0", logo: true, admin: ["garuda@ngebola.test", "Hendra Gunawan"], desc: "Komunitas bola Sail sejak 2015. Suka main cepat, bawa wasit sendiri." },
    { key: "sukajadi", name: "Sukajadi United", area: "Sukajadi", level: "menengah", year: 2019, color: "#b23a2e", away: "#fbf8f1", logo: true, admin: ["sukajadi@ngebola.test", "Reza Harahap"], desc: "Gabungan warga Sukajadi. Main santai tapi serius soal waktu." },
    { key: "tenayan", name: "Tenayan Raya FC", area: "Tenayan Raya", level: "pemula", year: 2021, color: "#e46a1f", away: "#14201a", logo: true, admin: ["tenayan@ngebola.test", "Agus Salim"], desc: "Club muda dari Tenayan Raya, cari lawan untuk jam terbang." },
    { key: "rumbai", name: "Rumbai Veteran", area: "Rumbai", level: "pemula", year: 2012, color: "#5b3a8c", away: "#fbf8f1", logo: true, admin: ["rumbai@ngebola.test", "Budi Hartono"], desc: "Club om-om 40+. Sportif, santai, tetap kompetitif." },
    { key: "marpoyan", name: "Marpoyan Damai FC", area: "Marpoyan Damai", level: "menengah", year: 2017, color: "#1d7a77", away: "#fbf8f1", logo: true, admin: ["marpoyan@ngebola.test", "Arif Setiawan"], desc: "Main rutin Rabu malam di Arengka." },
    { key: "kulim", name: "Kulim Jaya FC", area: "Kulim", level: "pemula", year: 2024, color: "#24507a", away: "#fbf8f1", logo: false, admin: ["kulim@ngebola.test", "Joko Susilo"], desc: "Club baru, menunggu verifikasi.", status: "diajukan" },
    { key: "sailmuda", name: "Sail Muda FC", area: "Sail", level: "pemula", year: 2025, color: "#a8382a", away: "#fbf8f1", logo: false, admin: ["sailmuda@ngebola.test", "Teguh Santoso"], desc: "Club pelajar & mahasiswa.", status: "ditolak" },
  ] as const;

  const club: Record<(typeof DATA_CLUB)[number]["key"], string> = {} as never;
  const adminClub: Record<string, string> = {};
  for (const c of DATA_CLUB) {
    const adminId = akun(c.admin[0], c.admin[1], "club_admin", "1988-05-20");
    const id = randomUUID();
    const status = "status" in c ? c.status : "disetujui";
    db.insert(s.clubs)
      .values({
        id,
        adminUserId: adminId,
        slug: slugify(c.name),
        name: c.name,
        nameKey: kunciNama(c.name),
        area: c.area,
        foundedYear: c.year,
        level: c.level,
        description: c.desc,
        contactPhone: "0812-0000-" + String(1000 + Object.keys(club).length).slice(-4),
        logoPath: c.logo ? `/demo/lambang/${slugify(c.name)}.svg` : null,
        crestColor: c.color,
        initials: inisialDari(c.name),
        jerseyHome: c.color,
        jerseyAway: c.away,
        registrationStatus: status,
        rejectionReason: status === "ditolak" ? "Kontak pengurus belum bisa dihubungi. Lengkapi nomor yang aktif lalu ajukan ulang." : null,
        reviewedBy: status === "diajukan" ? null : adminPlatform,
        reviewedAt: status === "diajukan" ? null : geser(-50 * HARI),
        squadCode: randomCode(),
        createdAt: geser(status === "diajukan" ? -1 * HARI : -55 * HARI),
        updatedAt: geser(status === "diajukan" ? -1 * HARI : -50 * HARI),
      })
      .run();
    club[c.key] = id;
    adminClub[id] = adminId;
    if (status !== "diajukan") {
      db.insert(s.auditLogs)
        .values({ actorUserId: adminPlatform, action: status === "disetujui" ? "setujui_club" : "tolak_club", targetType: "club", targetId: id, reason: status === "disetujui" ? "Data pengurus lengkap" : "Kontak tidak aktif", createdAt: geser(-50 * HARI) })
        .run();
    }
  }

  // ── Pemain & skuad ────────────────────────────────────────────────────────
  const POSISI = ["kiper", "bek", "bek", "gelandang", "gelandang", "penyerang"] as const;
  const skuad: Record<string, string[]> = {};
  function pemain(email: string, name: string, clubId: string | null, i: number, status: "aktif" | "diajukan" = "aktif") {
    const id = akun(email, name, "player", `${1990 + (i % 12)}-0${1 + (i % 9)}-1${i % 10}`);
    db.update(s.players)
      .set({ position: POSISI[i % POSISI.length], dominantFoot: i % 5 === 0 ? "kiri" : "kanan", area: DATA_CLUB[i % 6].area })
      .where(eq(s.players.userId, id))
      .run();
    if (clubId) {
      db.insert(s.squadMemberships)
        .values({ playerUserId: id, clubId, status, via: i % 2 ? "kode" : "tautan", decidedBy: status === "aktif" ? adminClub[clubId] : null, createdAt: geser(-40 * HARI), decidedAt: status === "aktif" ? geser(-39 * HARI) : null })
        .run();
      if (status === "aktif") (skuad[clubId] ??= []).push(id);
    }
    return id;
  }
  const NAMA = [
    "Rizky Akbar", "Fajar Hidayat", "Ilham Saputra", "Bayu Ramadhan", "Eko Prasetyo", "Yoga Pratama", "Rahmat Hidayat",
    "Andi Wijaya", "Fikri Maulana", "Doni Kurniawan", "Wahyu Nugroho", "Putra Siregar", "Hafiz Lubis", "Gilang Permana",
  ];
  // Foto galeri contoh (Unsplash, lisensi Unsplash) untuk Lancang Kuning FC.
  for (let i = 1; i <= 6; i++) db.insert(s.clubPhotos).values({ clubId: club.lancang, path: `/demo/galeri/lancang-${i}.jpg`, sortOrder: i }).run();
  NAMA.forEach((n, i) => pemain(i === 0 ? "pemain@ngebola.test" : `${slugify(n)}@ngebola.test`, n, club.lancang, i));
  pemain("ari.pratama@ngebola.test", "Ari Pratama", club.lancang, 3, "diajukan");
  pemain("pemain.baru@ngebola.test", "Yudi Saputra", null, 4);
  const LAIN = ["Kevin", "Bagus", "Rio", "Dedi", "Rudi", "Imam", "Fauzi", "Galih", "Hadi", "Irfan"];
  (["garuda", "sukajadi", "tenayan", "rumbai", "marpoyan"] as const).forEach((k, ci) => {
    for (let j = 0; j < 5; j++) {
      const n = `${LAIN[(ci * 3 + j) % LAIN.length]} ${["Saputra", "Wijaya", "Nasution", "Pane", "Sitompul"][j]}`;
      pemain(`${k}.${j + 1}@ngebola.test`, n, club[k], ci + j);
    }
  });

  // ── Lapangan (fiktif) ─────────────────────────────────────────────────────
  const venue: Record<string, string> = {};
  const DATA_VENUE = [
    { key: "arengka", name: "Lapangan Arengka", address: "Jl. Arengka Raya No. 12 (contoh)", area: "Marpoyan Damai", lat: 0.4862, lng: 101.4271, surface: "sintetis", football: false, mini: true, price: 225000, verified: true },
    { key: "rumbai", name: "GOR Rumbai", address: "Jl. Sekolah No. 8, Rumbai (contoh)", area: "Rumbai", lat: 0.5946, lng: 101.4389, surface: "sintetis", football: false, mini: true, price: 150000, verified: true },
    { key: "soetta", name: "Arena Soekarno-Hatta", address: "Jl. Soekarno-Hatta No. 21 (contoh)", area: "Payung Sekaki", lat: 0.5165, lng: 101.4182, surface: "sintetis", football: true, mini: true, price: 250000, verified: true },
    { key: "tuah", name: "Stadion Mini Tuah Madani", address: "Jl. Kubang Raya No. 3 (contoh)", area: "Tuah Madani", lat: 0.4521, lng: 101.4093, surface: "alami", football: true, mini: false, price: 600000, verified: true },
    { key: "hangtuah", name: "Lapangan Hangtuah", address: "Jl. Hangtuah No. 45 (contoh)", area: "Sail", lat: 0.5238, lng: 101.4612, surface: "alami", football: true, mini: false, price: 400000, verified: false },
  ] as const;
  for (const v of DATA_VENUE) {
    const id = randomUUID();
    db.insert(s.venues)
      .values({
        id, name: v.name, address: v.address, area: v.area, lat: v.lat, lng: v.lng, surface: v.surface, forFootball: v.football, forMini: v.mini,
        pricePerHour: v.price, openHours: "07.00–23.00", facilities: "Parkir, toilet, musala, kantin", contact: "0761-000-000 (contoh)", verified: v.verified, managedBy: adminPlatform,
      })
      .run();
    for (const [hari, mulai, selesai] of [[6, "16:00", "18:00"], [6, "19:00", "21:00"], [3, "20:00", "22:00"]] as const) {
      db.insert(s.venueSlots).values({ venueId: id, dayOfWeek: hari, startTime: mulai, endTime: selesai, note: "Biasanya kosong" }).run();
    }
    venue[v.key] = id;
  }

  // ── Match di setiap status ────────────────────────────────────────────────
  type M = {
    status: Status;
    type?: "terbuka" | "tantangan";
    format: Format;
    creator: string;
    opponent?: string | null;
    at?: Date | null;
    venue?: string;
    fee?: number;
    notes?: string;
    opsi?: Date[];
    skor?: [number, number];
    extra?: Partial<typeof s.matches.$inferInsert>;
  };
  const AREA_CLUB = Object.fromEntries(DATA_CLUB.map((c) => [club[c.key], c] as const));

  function match(m: M) {
    const id = randomUUID();
    const c = AREA_CLUB[m.creator];
    const dibuat = m.at ? new Date(Math.min(m.at.getTime() - 5 * HARI, now.getTime() - HARI)) : geser(-2 * HARI);
    db.insert(s.matches)
      .values({
        id,
        type: m.type ?? "tantangan",
        format: m.format,
        status: m.status,
        creatorClubId: m.creator,
        opponentClubId: m.opponent ?? null,
        area: c.area,
        level: c.level,
        feeTotal: m.fee ?? (m.format === "mini" ? 450000 : 1200000),
        notes: m.notes ?? null,
        scheduledAt: m.at ?? null,
        venueId: m.venue ?? null,
        createdBy: adminClub[m.creator],
        createdAt: dibuat,
        updatedAt: dibuat,
        ...m.extra,
      })
      .run();
    // Opsi terpilih = jadwal match; tanpa jadwal: masih menunggu, kecuali match sudah ditolak/kedaluwarsa.
    const statusOpsi = (t: Date) =>
      m.at ? (t.getTime() === m.at.getTime() ? "dipilih" : "ditolak") : m.status === "ditolak" ? "ditolak" : m.status === "kedaluwarsa" ? "kedaluwarsa" : "menunggu";
    for (const t of m.opsi ?? (m.at ? [m.at] : [])) {
      db.insert(s.scheduleProposals)
        .values({ matchId: id, round: 0, proposedByClubId: m.creator, startsAt: t, venueId: m.venue ?? null, feeTotal: m.fee ?? null, status: statusOpsi(t), createdAt: dibuat })
        .run();
    }
    return id;
  }

  function hariH(id: string, m: { creator: string; opponent: string; at: Date; format: Format }, opsi: { checkin?: string[]; skor?: [number, number]; babak1?: [number, number]; selesai?: boolean; scorer?: string }) {
    const pencatat = opsi.scorer ?? m.creator;
    for (const cid of opsi.checkin ?? [m.creator, m.opponent]) {
      db.insert(s.checkins).values({ matchId: id, clubId: cid, checkedInAt: new Date(m.at.getTime() - 25 * MENIT), byUserId: adminClub[cid] }).run();
    }
    for (const cid of [m.creator, m.opponent]) {
      const siap = m.format === "mini" ? 7 : 12;
      db.insert(s.matchReadiness).values({ matchId: id, clubId: cid, playersReady: siap, isReady: true, updatedAt: new Date(m.at.getTime() - HARI), updatedBy: adminClub[cid] }).run();
    }
    if (!opsi.skor && !opsi.babak1) return;
    const entri = (half: number, sk: [number, number], event: "mulai" | "akhir_babak" | "selesai" | "skor", menit: number) =>
      db.insert(s.scoreEntries)
        .values({ matchId: id, half, creatorScore: sk[0], opponentScore: sk[1], event, recordedBy: adminClub[pencatat], clientEntryId: randomUUID(), recordedAt: new Date(m.at.getTime() + menit * MENIT), syncedAt: new Date(m.at.getTime() + menit * MENIT) })
        .run();
    entri(1, [0, 0], "mulai", 5);
    if (opsi.babak1) entri(1, opsi.babak1, "skor", 20);
    if (opsi.skor) {
      const b1: [number, number] = [Math.ceil(opsi.skor[0] / 2), Math.floor(opsi.skor[1] / 2)];
      entri(1, b1, "akhir_babak", 35);
      entri(2, opsi.skor, "selesai", 80);
    }
  }

  function selesai(creator: string, opponent: string, format: Format, hari: number, jam: string, v: string, skor: [number, number], ulasan = true) {
    const at = pada(hari, jam);
    const id = match({
      status: "selesai", format, creator, opponent, at, venue: v,
      extra: { scorerClubId: creator, startedAt: new Date(at.getTime() + 5 * MENIT), endedAt: new Date(at.getTime() + 80 * MENIT), finalCreatorScore: skor[0], finalOpponentScore: skor[1] },
    });
    hariH(id, { creator, opponent, at, format }, { skor });
    const usul = new Date(at.getTime() + 85 * MENIT);
    db.insert(s.resultConfirmations)
      .values({ matchId: id, proposerClubId: creator, creatorScore: skor[0], opponentScore: skor[1], proposedAt: usul, deadline: new Date(usul.getTime() + 48 * JAM), response: "setuju", respondedAt: new Date(usul.getTime() + 2 * JAM) })
      .run();
    // Rating diterapkan berurutan waktu, sama seperti saat hasil dikonfirmasi di aplikasi.
    db.transaction((tx) => terapkanRating(tx, id, new Date(at.getTime() + 2 * JAM)));
    if (ulasan) {
      for (const [dari, ke] of [[creator, opponent], [opponent, creator]]) {
        db.insert(s.reviews).values({ matchId: id, reviewerClubId: dari, reviewedClubId: ke, sportsmanship: 4 + (hari % 2), tidiness: 4, comment: "Main sportif, datang tepat waktu.", createdAt: new Date(usul.getTime() + 3 * JAM) }).run();
      }
    }
    return id;
  }

  // Riwayat hasil (urut waktu) untuk leaderboard, head-to-head, dan riwayat pemain.
  selesai(club.garuda, club.lancang, "mini", -32, "19:00", venue.arengka, [1, 0]);
  selesai(club.lancang, club.sukajadi, "mini", -30, "19:00", venue.arengka, [2, 2]);
  selesai(club.lancang, club.tenayan, "mini", -25, "16:00", venue.rumbai, [4, 1]);
  selesai(club.rumbai, club.garuda, "mini", -23, "16:00", venue.rumbai, [2, 4]);
  selesai(club.marpoyan, club.lancang, "mini", -18, "20:00", venue.arengka, [1, 2]);
  selesai(club.tenayan, club.sukajadi, "mini", -16, "19:00", venue.soetta, [0, 3]);
  selesai(club.sukajadi, club.lancang, "football", -11, "16:00", venue.tuah, [1, 1]);
  selesai(club.garuda, club.marpoyan, "mini", -9, "19:00", venue.soetta, [2, 0]);
  const terakhir = selesai(club.lancang, club.garuda, "mini", -4, "19:00", venue.arengka, [3, 2], false);
  // Penilaian tersembunyi: baru satu pihak yang mengisi.
  db.insert(s.reviews).values({ matchId: terakhir, reviewerClubId: club.garuda, reviewedClubId: club.lancang, sportsmanship: 5, tidiness: 4, comment: "Seru, ditunggu rematch!" }).run();

  // Hasil dikonfirmasi pemain yang ikut (RSVP) untuk riwayat pemain.
  for (const pid of skuad[club.lancang].slice(0, 9)) {
    db.insert(s.rsvps).values({ matchId: terakhir, playerUserId: pid, clubId: club.lancang, answer: "ikut", updatedAt: pada(-5, "10:00") }).run();
  }

  // Menunggu konfirmasi hasil: Lancang mengusulkan 3-1, Rumbai belum merespons.
  {
    const at = pada(-1, "16:00");
    const id = match({ status: "menunggu_hasil", format: "mini", creator: club.lancang, opponent: club.rumbai, at, venue: venue.rumbai, extra: { scorerClubId: club.lancang, startedAt: new Date(at.getTime() + 5 * MENIT), endedAt: new Date(at.getTime() + 80 * MENIT) } });
    hariH(id, { creator: club.lancang, opponent: club.rumbai, at, format: "mini" }, { skor: [3, 1] });
    const usul = new Date(at.getTime() + 85 * MENIT);
    db.insert(s.resultConfirmations).values({ matchId: id, proposerClubId: club.lancang, creatorScore: 3, opponentScore: 1, proposedAt: usul, deadline: new Date(usul.getTime() + 48 * JAM), remindersSent: 1 }).run();
  }

  // Sengketa: Sukajadi mengusulkan 2-1, Marpoyan menyanggah 1-1.
  {
    const at = pada(-3, "20:00");
    const id = match({ status: "sengketa", format: "mini", creator: club.sukajadi, opponent: club.marpoyan, at, venue: venue.arengka, extra: { scorerClubId: club.sukajadi, startedAt: new Date(at.getTime() + 5 * MENIT), endedAt: new Date(at.getTime() + 80 * MENIT) } });
    hariH(id, { creator: club.sukajadi, opponent: club.marpoyan, at, format: "mini" }, { skor: [2, 1] });
    const usul = new Date(at.getTime() + 85 * MENIT);
    db.insert(s.resultConfirmations)
      .values({ matchId: id, proposerClubId: club.sukajadi, creatorScore: 2, opponentScore: 1, proposedAt: usul, deadline: new Date(usul.getTime() + 48 * JAM), response: "sanggah", counterCreatorScore: 1, counterOpponentScore: 1, respondedAt: new Date(usul.getTime() + 5 * JAM) })
      .run();
    const dId = randomUUID();
    const buka = new Date(usul.getTime() + 5 * JAM);
    db.insert(s.disputes).values({ id: dId, matchId: id, openedAt: buka, evidenceDeadline: new Date(buka.getTime() + 48 * JAM) }).run();
    db.insert(s.disputeEvidence).values({ disputeId: dId, clubId: club.sukajadi, note: "Foto papan skor setelah peluit akhir.", url: "https://contoh.id/bukti/papan-skor", createdAt: new Date(buka.getTime() + 2 * JAM) }).run();
    db.insert(s.disputeEvidence).values({ disputeId: dId, clubId: club.marpoyan, note: "Gol kedua Sukajadi offside, wasit sudah meniup peluit.", url: "https://contoh.id/bukti/video", createdAt: new Date(buka.getTime() + 3 * JAM) }).run();
  }

  // WO: hanya Tenayan check-in.
  {
    const at = pada(-6, "19:00");
    const id = match({ status: "wo", format: "mini", creator: club.tenayan, opponent: club.rumbai, at, venue: venue.soetta, extra: { woWinnerClubId: club.tenayan, excludedFromRating: true } });
    hariH(id, { creator: club.tenayan, opponent: club.rumbai, at, format: "mini" }, { checkin: [club.tenayan] });
  }

  // Berlangsung: babak 1, 1-0.
  {
    const at = new Date(now.getTime() - 40 * MENIT);
    const id = match({ status: "berlangsung", format: "mini", creator: club.garuda, opponent: club.tenayan, at, venue: venue.soetta, extra: { scorerClubId: club.garuda, startedAt: new Date(at.getTime() + 5 * MENIT) } });
    hariH(id, { creator: club.garuda, opponent: club.tenayan, at, format: "mini" }, { babak1: [1, 0] });
  }

  // Terkonfirmasi: Garuda vs Lancang, 3 hari lagi. RSVP pemain & kesiapan.
  {
    const at = pada(3, "19:00");
    const id = match({ status: "terkonfirmasi", format: "mini", creator: club.garuda, opponent: club.lancang, at, venue: venue.arengka, notes: "Bawa rompi 2 warna ya, kami sedia bola & air minum." });
    const jawab = ["ikut", "ikut", "ikut", "ikut", "ikut", "ikut", "ikut", "tidak", "ragu", "ikut", "tidak"] as const;
    skuad[club.lancang].slice(0, jawab.length).forEach((pid, i) =>
      db.insert(s.rsvps).values({ matchId: id, playerUserId: pid, clubId: club.lancang, answer: jawab[i], updatedAt: geser(-HARI + i * MENIT) }).run(),
    );
    db.insert(s.matchReadiness).values({ matchId: id, clubId: club.lancang, playersReady: 8, isReady: true, updatedAt: geser(-HARI), updatedBy: adminClub[club.lancang] }).run();
    db.insert(s.matchReadiness).values({ matchId: id, clubId: club.garuda, playersReady: 6, manualOverride: true, isReady: false, updatedAt: geser(-HARI), updatedBy: adminClub[club.garuda] }).run();
    const chat = [
      [null, "sistem", "Tantangan diterima. Chat match dibuka."],
      [club.garuda, "manusia", "Halo Lancang, jadi Sabtu jam 7 malam ya di Arengka."],
      [club.lancang, "manusia", "Siap bang. Kami pakai jersey kuning."],
      [null, "sistem", "Match terkonfirmasi: Sab, jam 19.00 WIB di Lapangan Arengka."],
    ] as const;
    chat.forEach(([cid, kind, body], i) =>
      db.insert(s.chatMessages).values({ matchId: id, senderUserId: cid ? adminClub[cid] : null, kind, body, createdAt: geser(-2 * HARI + i * JAM) }).run(),
    );
    // Contoh antrean moderasi: satu laporan pesan & satu tanda anti-manipulasi.
    const kasar = crypto.randomUUID();
    db.insert(s.chatMessages).values({ id: kasar, matchId: id, senderUserId: adminClub[club.garuda], kind: "manusia", body: "Awas kalian kalau telat lagi!", createdAt: geser(-HARI) }).run();
    db.insert(s.reports).values({ reporterUserId: adminClub[club.lancang], targetType: "pesan", targetId: kasar, reason: "Nada mengancam di chat match.", createdAt: geser(-20 * JAM) }).run();
    db.insert(s.moderationFlags).values({ kind: "lonjakan_rating", clubId: club.garuda, detail: "Contoh demo: naik 210 poin dalam 5 match terakhir (mini).", createdAt: geser(-2 * HARI) }).run();
  }
  // Hari H: kick-off 30 menit lagi, check-in sudah dibuka (WO otomatis bila tidak ada yang hadir).
  {
    const at = new Date(Math.ceil((now.getTime() + 30 * MENIT) / (5 * MENIT)) * 5 * MENIT);
    const id = match({ status: "terkonfirmasi", format: "mini", creator: club.sukajadi, opponent: club.lancang, at, venue: venue.soetta });
    for (const cid of [club.sukajadi, club.lancang]) {
      db.insert(s.matchReadiness).values({ matchId: id, clubId: cid, playersReady: 7, manualOverride: true, isReady: true, updatedAt: geser(-HARI), updatedBy: adminClub[cid] }).run();
    }
    db.insert(s.chatMessages).values({ matchId: id, kind: "sistem", body: "Match terkonfirmasi. Check-in dibuka 60 menit sebelum kick-off.", createdAt: geser(-2 * HARI) }).run();
  }
  // Terkonfirmasi #2 (11v11).
  match({ status: "terkonfirmasi", format: "football", creator: club.lancang, opponent: club.sukajadi, at: pada(8, "16:00"), venue: venue.tuah, fee: 1200000 });

  // Ditunda karena hujan; jadwal baru dipilih maksimal 14 hari.
  match({
    status: "ditunda", format: "mini", creator: club.rumbai, opponent: club.sukajadi, at: pada(-1, "19:00"), venue: venue.rumbai,
    extra: { postponedAt: pada(-1, "17:00"), rescheduleDeadline: new Date(pada(-1, "17:00").getTime() + 14 * HARI) },
  });

  // Dinegosiasi: Tenayan menantang Lancang, Lancang menawar balik (putaran 1).
  {
    const awal = pada(5, "20:00");
    const id = match({ status: "dinegosiasi", format: "mini", creator: club.tenayan, opponent: club.lancang, opsi: [awal], venue: venue.soetta, extra: { negotiationRound: 1, responseDeadline: geser(60 * JAM) } });
    db.update(s.scheduleProposals).set({ status: "ditolak" }).where(eq(s.scheduleProposals.matchId, id)).run();
    db.insert(s.scheduleProposals).values({ matchId: id, round: 1, proposedByClubId: club.lancang, startsAt: pada(6, "19:00"), venueId: venue.arengka, feeTotal: 450000, status: "menunggu" }).run();
  }

  // Ditantang: Lancang menantang Marpoyan dengan 2 opsi.
  match({ status: "ditantang", format: "mini", creator: club.lancang, opponent: club.marpoyan, opsi: [pada(6, "20:00"), pada(9, "20:00")], venue: venue.arengka, extra: { responseDeadline: geser(70 * JAM) } });

  // Match terbuka (mencari lawan).
  match({ status: "terbuka", type: "terbuka", format: "football", creator: club.garuda, opsi: [pada(5, "16:00"), pada(7, "16:00")], venue: venue.tuah, fee: 1200000, notes: "Cari lawan 11v11 level mahir/menengah." });
  match({ status: "terbuka", type: "terbuka", format: "mini", creator: club.sukajadi, opsi: [pada(4, "19:00")], venue: venue.soetta });
  match({ status: "terbuka", type: "terbuka", format: "mini", creator: club.marpoyan, opsi: [pada(9, "20:00"), pada(10, "20:00"), pada(11, "20:00")], venue: venue.arengka });

  // Draf, ditolak, kedaluwarsa, dibatalkan.
  match({ status: "draf", type: "terbuka", format: "mini", creator: club.lancang, opsi: [pada(12, "19:00")], venue: venue.arengka });
  match({ status: "ditolak", format: "mini", creator: club.rumbai, opponent: club.lancang, opsi: [pada(-5, "16:00")], venue: venue.rumbai });
  match({ status: "kedaluwarsa", type: "terbuka", format: "mini", creator: club.tenayan, opsi: [pada(-2, "19:00")], venue: venue.soetta });
  match({
    status: "dibatalkan", format: "football", creator: club.garuda, opponent: club.sukajadi, at: pada(1, "16:00"), venue: venue.tuah,
    extra: { cancelledByClubId: club.garuda, cancelReason: "cuaca", cancelNote: "Lapangan tergenang setelah hujan deras.", lateCancel: false },
  });

  console.info(`Seed selesai (${DB_PATH}). Password semua akun demo: ${PASSWORD_DEMO}`);
  console.info("  Admin platform : admin@ngebola.test");
  console.info("  Admin club     : club@ngebola.test (Lancang Kuning FC)");
  console.info("  Pemain         : pemain@ngebola.test (skuad Lancang Kuning FC)");
  console.info("  Pemain tanpa club: pemain.baru@ngebola.test · Club menunggu verifikasi: kulim@ngebola.test");
}

main();
