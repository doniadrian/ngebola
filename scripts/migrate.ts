// Terapkan migrasi drizzle/ ke database (DATABASE_PATH, bawaan data/ngebola.db).
import { migrateDb } from "@/db";

migrateDb();
console.info(`Migrasi selesai: ${process.env.DATABASE_PATH ?? "data/ngebola.db"}`);
