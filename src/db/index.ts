import "server-only";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

function buka() {
  const path = process.env.DATABASE_PATH ?? "data/ngebola.db";
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema, casing: "snake_case" });
}

export type Db = ReturnType<typeof buka>;

// Satu koneksi per proses (hot reload Next membuat modul dimuat ulang).
const g = globalThis as unknown as { __ngebolaDb?: Db };
export const db: Db = g.__ngebolaDb ?? (g.__ngebolaDb = buka());

export function migrateDb() {
  migrate(db, { migrationsFolder: "drizzle" });
}

export { schema };
