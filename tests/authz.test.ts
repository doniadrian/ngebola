import { beforeEach, describe, expect, it } from "vitest";
import type { Peran } from "@/db/enums";
import { createSession, createUser } from "@/server/auth/service";
import { COOKIE_SESI } from "@/server/auth/session";
import { redirectIfSignedIn, requireRole, requireUser } from "@/server/authz";
import { cookieJar, tangkapRedirect } from "./helpers";

let n = 0;
async function masukSebagai(role: Peran) {
  const r = await createUser({ email: `authz${++n}@contoh.id`, password: "rahasia-kuat-123", name: "X", role });
  if (!r.ok) throw new Error();
  cookieJar.set(COOKIE_SESI, createSession(r.userId, null).token);
  return r.userId;
}

beforeEach(() => cookieJar.clear());

describe("pemeriksaan akses di server", () => {
  it("tanpa sesi diarahkan ke /masuk", async () => {
    expect(await tangkapRedirect(() => requireUser())).toBe("/masuk");
    expect(await tangkapRedirect(() => requireRole("club_admin"))).toBe("/masuk");
  });

  it("token sesi palsu dianggap belum masuk", async () => {
    cookieJar.set(COOKIE_SESI, "token-palsu");
    expect(await tangkapRedirect(() => requireRole("player"))).toBe("/masuk");
  });

  it.each([
    ["player", "club_admin", "/pemain"],
    ["player", "platform_admin", "/pemain"],
    ["club_admin", "player", "/club"],
    ["club_admin", "platform_admin", "/club"],
    ["platform_admin", "club_admin", "/platform"],
    ["platform_admin", "player", "/platform"],
  ] as const)("%s yang membuka area %s diarahkan ke %s", async (punya, minta, tujuan) => {
    await masukSebagai(punya);
    expect(await tangkapRedirect(() => requireRole(minta))).toBe(tujuan);
  });

  it("peran yang cocok mendapat data user", async () => {
    const id = await masukSebagai("club_admin");
    const user = await requireRole("club_admin");
    expect(user.id).toBe(id);
    expect(user.role).toBe("club_admin");
  });

  it("halaman tamu mengarahkan yang sudah masuk ke berandanya", async () => {
    await masukSebagai("platform_admin");
    expect(await tangkapRedirect(() => redirectIfSignedIn())).toBe("/platform");
  });
});
