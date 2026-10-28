import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { Peran } from "@/db/enums";
import { createSession, createUser } from "@/server/auth/service";
import { COOKIE_SESI } from "@/server/auth/session";
import { BERANDA_PERAN } from "@/server/authz";
import { cookieJar, RedirectError } from "./helpers";

// Setiap layout & halaman di area peran wajib memeriksa peran di server sendiri
// (layout dan halaman App Router dirender paralel, jadi pemeriksaan di layout saja tidak cukup).
const AKAR = join(process.cwd(), "src", "app", "(app)");
const AREA: Record<string, Peran> = { club: "club_admin", pemain: "player", platform: "platform_admin" };

const berkas = readdirSync(AKAR, { recursive: true, encoding: "utf8" })
  .filter((f) => /(^|[\\/])(page|layout)\.tsx$/.test(f))
  .map((f) => ({ rel: f.split(sep).join("/"), area: f.split(sep)[0] }));

let n = 0;
async function masukSebagai(role: Peran) {
  const r = await createUser({ email: `akses${++n}@contoh.id`, password: "rahasia-kuat-123", name: "Uji", role });
  if (!r.ok) throw new Error();
  cookieJar.set(COOKIE_SESI, createSession(r.userId, null).token);
}

async function panggil(rel: string) {
  const mod = await import(/* @vite-ignore */ join(AKAR, rel));
  // Semua halaman di area ini tanpa params; layout menerima children.
  return mod.default({ children: null, params: Promise.resolve({}), searchParams: Promise.resolve({}) });
}

beforeEach(() => cookieJar.clear());

// Tiap halaman diimpor pertama kali di sini (puluhan modul), jadi lambat saat tes lain berjalan paralel.
describe("akses halaman per peran", { timeout: 120_000 }, () => {
  it("menemukan halaman untuk ketiga area", () => {
    expect(new Set(berkas.map((b) => b.area))).toEqual(new Set(Object.keys(AREA)));
    expect(berkas.length).toBeGreaterThan(15);
  });

  for (const { rel, area } of berkas) {
    const pemilik = AREA[area];
    it(`${relative(".", rel)}: tamu → /masuk, peran lain → berandanya, pemilik → tampil`, async () => {
      await expect(panggil(rel)).rejects.toMatchObject({ url: "/masuk" });
      for (const lain of Object.values(AREA).filter((p) => p !== pemilik)) {
        cookieJar.clear();
        await masukSebagai(lain);
        const err = await panggil(rel).then(() => null, (e) => e);
        expect(err).toBeInstanceOf(RedirectError);
        expect((err as RedirectError).url).toBe(BERANDA_PERAN[lain]);
      }
      cookieJar.clear();
      await masukSebagai(pemilik);
      // Pemilik boleh tampil, atau diarahkan ke halaman lain di areanya sendiri (mis. belum punya club → daftar-club).
      const hasil = await panggil(rel).then((v) => ({ v }), (e) => ({ e }));
      if ("e" in hasil) {
        // Halaman berparameter tanpa data (params kosong di tes) boleh 404.
        if ((hasil.e as Error).message === "NOT_FOUND") return;
        expect(hasil.e).toBeInstanceOf(RedirectError);
        expect((hasil.e as RedirectError).url.startsWith(BERANDA_PERAN[pemilik])).toBe(true);
      } else expect(hasil.v).toBeTruthy();
    });
  }
});
