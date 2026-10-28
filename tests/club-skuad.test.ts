import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, clubs, matches, notifications, players, rsvps, squadMemberships } from "@/db/schema";
import { simpanClubAction } from "@/server/actions/club";
import { putuskanRegistrasiAction } from "@/server/actions/platform";
import { simpanProfilPemainAction } from "@/server/actions/pemain";
import { buatUndanganAction, keluarkanAnggotaAction, keluarSkuadAction, mintaGabungAction, putuskanPermintaanAction } from "@/server/actions/skuad";
import { bolehLihatPemain } from "@/server/akses";
import { getSessionUser } from "@/server/auth/service";
import { COOKIE_SESI } from "@/server/auth/session";
import { clubDariUndangan } from "@/server/skuad";
import { DATA_CLUB, masukSebagai } from "./akun";
import { cookieJar, formData, tangkapRedirect } from "./helpers";

const sesi = () => getSessionUser(cookieJar.get(COOKIE_SESI)!)!;
const clubAdmin = (adminId: string) => db.select().from(clubs).where(eq(clubs.adminUserId, adminId)).get()!;

let urut = 0;
async function clubDisetujui(nama = `Club Uji ${++urut}`) {
  const adminId = await masukSebagai("club_admin", "Admin");
  const adminToken = cookieJar.get(COOKIE_SESI)!;
  await tangkapRedirect(() => simpanClubAction({}, formData({ ...DATA_CLUB, name: nama })));
  const c = clubAdmin(adminId);
  await masukSebagai("platform_admin");
  await putuskanRegistrasiAction(c.id, "setujui", {}, formData({}));
  return { adminId, adminToken, club: clubAdmin(adminId) };
}

beforeEach(() => cookieJar.clear());

describe("registrasi & verifikasi club", () => {
  it("Admin club mendaftarkan club → Diajukan, Admin platform diberi tahu", async () => {
    await masukSebagai("platform_admin");
    const platformId = sesi().id;
    const adminId = await masukSebagai("club_admin");
    expect(await tangkapRedirect(() => simpanClubAction({}, formData(DATA_CLUB)))).toBe("/club?registrasi=diajukan");
    const c = clubAdmin(adminId);
    expect(c.registrationStatus).toBe("diajukan");
    expect(c.slug).toBe("bintang-senapelan");
    expect(c.contactPhone).toBe("081234567890");
    expect(db.select().from(notifications).where(eq(notifications.userId, platformId)).all().some((n) => n.trigger === "registrasi_club")).toBe(true);
  });

  it("satu akun hanya satu club: simpan kedua kali memperbarui club yang sama", async () => {
    const adminId = await masukSebagai("club_admin");
    await tangkapRedirect(() => simpanClubAction({}, formData({ ...DATA_CLUB, name: "Club Satu" })));
    const r = await simpanClubAction({}, formData({ ...DATA_CLUB, name: "Club Satu Baru" }));
    expect(r.ok).toBe(true);
    expect(db.select().from(clubs).where(eq(clubs.adminUserId, adminId)).all()).toHaveLength(1);
  });

  it("nama club unik per kota (tanpa beda huruf besar/spasi)", async () => {
    await masukSebagai("club_admin");
    await tangkapRedirect(() => simpanClubAction({}, formData({ ...DATA_CLUB, name: "Garuda Muda" })));
    await masukSebagai("club_admin");
    const r = await simpanClubAction({}, formData({ ...DATA_CLUB, name: "garuda  MUDA" }));
    expect(r.fieldErrors?.name).toMatch(/sudah dipakai/);
  });

  it("validasi: nomor HP, warna dari daftar, tahun", async () => {
    await masukSebagai("club_admin");
    const r = await simpanClubAction({}, formData({ ...DATA_CLUB, contactPhone: "12345", crestColor: "#ff00ff", foundedYear: "2999" }));
    expect(Object.keys(r.fieldErrors ?? {}).sort()).toEqual(["contactPhone", "crestColor", "foundedYear"]);
  });

  it("Pemain dan Admin platform tidak bisa mendaftarkan club", async () => {
    await masukSebagai("player");
    expect(await tangkapRedirect(() => simpanClubAction({}, formData(DATA_CLUB)))).toBe("/pemain");
    await masukSebagai("platform_admin");
    expect(await tangkapRedirect(() => simpanClubAction({}, formData(DATA_CLUB)))).toBe("/platform");
  });

  it("hanya Admin platform yang memutuskan; tolak wajib alasan; tercatat di audit; ajukan ulang", async () => {
    const adminId = await masukSebagai("club_admin");
    await tangkapRedirect(() => simpanClubAction({}, formData({ ...DATA_CLUB, name: "Club Ditolak" })));
    const c = clubAdmin(adminId);
    expect(await tangkapRedirect(() => putuskanRegistrasiAction(c.id, "setujui", {}, formData({})))).toBe("/club");

    await masukSebagai("platform_admin");
    expect((await putuskanRegistrasiAction(c.id, "tolak", {}, formData({ alasan: "x" }))).fieldErrors?.alasan).toBeDefined();
    expect((await putuskanRegistrasiAction(c.id, "tolak", {}, formData({ alasan: "Kontak pengurus tidak aktif." }))).ok).toBe(true);
    expect(clubAdmin(adminId)).toMatchObject({ registrationStatus: "ditolak", rejectionReason: "Kontak pengurus tidak aktif." });
    expect(db.select().from(auditLogs).where(and(eq(auditLogs.targetId, c.id), eq(auditLogs.action, "tolak_club"))).get()?.reason).toBe("Kontak pengurus tidak aktif.");
    expect((await putuskanRegistrasiAction(c.id, "setujui", {}, formData({}))).error).toMatch(/sudah diputuskan/);

    // Perbaiki data → otomatis diajukan ulang.
    cookieJar.clear();
    const { createSession } = await import("@/server/auth/service");
    cookieJar.set(COOKIE_SESI, createSession(adminId, null).token);
    expect(await tangkapRedirect(() => simpanClubAction({}, formData({ ...DATA_CLUB, name: "Club Ditolak", contactPhone: "081299998888" })))).toBe("/club?registrasi=diajukan");
    expect(clubAdmin(adminId)).toMatchObject({ registrationStatus: "diajukan", rejectionReason: null });
  });
});

describe("skuad", () => {
  it("pemain minta gabung lewat kode → admin menyetujui → aktif; satu club aktif per pemain", async () => {
    const a = await clubDisetujui();
    const b = await clubDisetujui();
    const pemainId = await masukSebagai("player", "Rizky");
    const pemainToken = cookieJar.get(COOKIE_SESI)!;

    expect((await mintaGabungAction({}, formData({ kode: "ZZZZZZ" }))).fieldErrors?.kode).toMatch(/tidak ditemukan/);
    expect((await mintaGabungAction({}, formData({ kode: a.club.squadCode.toLowerCase() }))).ok).toBe(true);
    expect((await mintaGabungAction({}, formData({ kode: b.club.squadCode }))).fieldErrors?.kode).toMatch(/Batalkan dulu/);

    const m = db.select().from(squadMemberships).where(eq(squadMemberships.playerUserId, pemainId)).get()!;
    // Pemain tidak bisa menyetujui dirinya sendiri; admin club lain tidak bisa memutuskan.
    expect(await tangkapRedirect(() => putuskanPermintaanAction(m.id, true))).toBe("/pemain");
    cookieJar.set(COOKIE_SESI, b.adminToken);
    expect((await putuskanPermintaanAction(m.id, true)).ok).toBe(false);
    cookieJar.set(COOKIE_SESI, a.adminToken);
    expect((await putuskanPermintaanAction(m.id, true)).ok).toBe(true);

    cookieJar.set(COOKIE_SESI, pemainToken);
    expect((await mintaGabungAction({}, formData({ kode: b.club.squadCode }))).fieldErrors?.kode).toMatch(/sudah anggota aktif/);
    expect(db.select().from(notifications).where(and(eq(notifications.userId, pemainId), eq(notifications.trigger, "keputusan_skuad"))).get()).toBeDefined();
  });

  it("tautan undangan: hanya Admin club, berlaku untuk club-nya, bisa dipakai untuk minta gabung", async () => {
    const a = await clubDisetujui();
    cookieJar.set(COOKIE_SESI, a.adminToken);
    const r = await buatUndanganAction();
    if (!r.ok) throw new Error(r.error);
    const token = r.url.split("/undangan/")[1];
    expect(clubDariUndangan(token)?.id).toBe(a.club.id);
    await masukSebagai("player");
    expect((await mintaGabungAction({}, formData({ token }))).ok).toBe(true);
    expect(await tangkapRedirect(() => buatUndanganAction())).toBe("/pemain");
  });

  it("keluar / dikeluarkan menghapus RSVP match mendatang, RSVP match lama tetap", async () => {
    const a = await clubDisetujui();
    const pemainId = await masukSebagai("player");
    const pemainToken = cookieJar.get(COOKIE_SESI)!;
    await mintaGabungAction({}, formData({ kode: a.club.squadCode }));
    const m = db.select().from(squadMemberships).where(eq(squadMemberships.playerUserId, pemainId)).get()!;
    cookieJar.set(COOKIE_SESI, a.adminToken);
    await putuskanPermintaanAction(m.id, true);

    const buat = (status: "terkonfirmasi" | "selesai", jam: number) => {
      const id = crypto.randomUUID();
      db.insert(matches).values({ id, type: "tantangan", format: "mini", status, creatorClubId: a.club.id, area: "Sail", level: "pemula", scheduledAt: new Date(Date.now() + jam * 3600_000), createdBy: a.adminId }).run();
      db.insert(rsvps).values({ matchId: id, playerUserId: pemainId, clubId: a.club.id, answer: "ikut" }).run();
      return id;
    };
    const depan = buat("terkonfirmasi", 48);
    const lama = buat("selesai", -48);

    cookieJar.set(COOKIE_SESI, pemainToken);
    expect((await keluarSkuadAction()).ok).toBe(true);
    const sisa = db.select().from(rsvps).where(eq(rsvps.playerUserId, pemainId)).all().map((r) => r.matchId);
    expect(sisa).toEqual([lama]);
    expect(sisa).not.toContain(depan);

    // Admin mengeluarkan anggota lain.
    const p2 = await masukSebagai("player");
    await mintaGabungAction({}, formData({ kode: a.club.squadCode }));
    const m2 = db.select().from(squadMemberships).where(eq(squadMemberships.playerUserId, p2)).get()!;
    cookieJar.set(COOKIE_SESI, a.adminToken);
    await putuskanPermintaanAction(m2.id, true);
    expect((await keluarkanAnggotaAction(m2.id)).ok).toBe(true);
    expect(db.select().from(squadMemberships).where(eq(squadMemberships.id, m2.id)).get()).toMatchObject({ status: "keluar", endedBy: "admin" });
  });
});

describe("privasi profil pemain", () => {
  it("hanya diri sendiri, Admin platform, admin club-nya, dan sesama anggota aktif", async () => {
    const a = await clubDisetujui();
    const b = await clubDisetujui();
    const gabung = async () => {
      const id = await masukSebagai("player");
      await mintaGabungAction({}, formData({ kode: a.club.squadCode }));
      return id;
    };
    const p1 = await gabung();
    const p2 = await gabung();
    cookieJar.set(COOKIE_SESI, a.adminToken);
    for (const pid of [p1, p2]) {
      const m = db.select().from(squadMemberships).where(eq(squadMemberships.playerUserId, pid)).get()!;
      await putuskanPermintaanAction(m.id, true);
    }
    const asing = await masukSebagai("player");
    const platform = await masukSebagai("platform_admin");
    const lihat = (viewerId: string | null, role: "player" | "club_admin" | "platform_admin") =>
      bolehLihatPemain(viewerId ? { id: viewerId, role, name: "", email: "", sessionId: "" } : null, p1);

    expect(lihat(p1, "player")).toBe(true);
    expect(lihat(p2, "player")).toBe(true);
    expect(lihat(a.adminId, "club_admin")).toBe(true);
    expect(lihat(platform, "platform_admin")).toBe(true);
    expect(lihat(asing, "player")).toBe(false);
    expect(lihat(b.adminId, "club_admin")).toBe(false);
    expect(lihat(null, "player")).toBe(false);
  });

  it("pemain menyimpan profil sendiri; validasi posisi", async () => {
    const id = await masukSebagai("player");
    expect((await simpanProfilPemainAction({}, formData({ name: "Rizky A", position: "striker" }))).fieldErrors?.position).toBeDefined();
    expect((await simpanProfilPemainAction({}, formData({ name: "Rizky A", position: "penyerang", dominantFoot: "kiri", area: "Sail" }))).ok).toBe(true);
    expect(db.select().from(players).where(eq(players.userId, id)).get()).toMatchObject({ position: "penyerang", dominantFoot: "kiri", area: "Sail" });
  });
});
