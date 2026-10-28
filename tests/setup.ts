import { vi } from "vitest";

// Tiruan cookie/header Next dan redirect, supaya server action & pemeriksaan akses bisa dites langsung.
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("./helpers");
  return {
    cookies: async () => ({
      get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
      set: (name: string, value: string) => void cookieJar.set(name, value),
      delete: (name: string) => void cookieJar.delete(name),
    }),
    headers: async () => new Headers({ "user-agent": "vitest" }),
  };
});

vi.mock("next/navigation", async () => {
  const { RedirectError } = await import("./helpers");
  return {
    redirect: (url: string) => {
      throw new RedirectError(url);
    },
    notFound: () => {
      throw new Error("NOT_FOUND");
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {}, updateTag: () => {} }));

// react.cache tidak menyimpan apa pun di luar React Server; cukup jalankan fungsinya.
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T>(fn: T) => fn }));

// Database SQLite di memori, baru untuk setiap file tes.
delete (globalThis as { __ngebolaDb?: unknown }).__ngebolaDb;
const { migrateDb } = await import("@/db");
migrateDb();
