// Provisioning internal Admin platform (PRD 2: tidak bisa daftar sendiri).
// Pakai: npm run platform:admin -- --email nama@domain --nama "Nama Lengkap" [--password "..."]
import { parseArgs } from "node:util";
import { randomBytes } from "node:crypto";
import { db, migrateDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { emailSchema, passwordBaruSchema } from "@/lib/validasi";
import { createUser } from "@/server/auth/service";

const { values } = parseArgs({
  options: { email: { type: "string" }, nama: { type: "string" }, password: { type: "string" } },
});

async function main() {
  const email = emailSchema.safeParse(values.email ?? "");
  if (!email.success || !values.nama?.trim()) {
    console.error('Pakai: npm run platform:admin -- --email nama@domain --nama "Nama Lengkap" [--password "..."]');
    process.exit(1);
  }
  const password = values.password ?? randomBytes(12).toString("base64url");
  const pw = passwordBaruSchema.safeParse(password);
  if (!pw.success) {
    console.error(pw.error.issues[0].message);
    process.exit(1);
  }
  migrateDb();
  const r = await createUser({ email: email.data, password, name: values.nama, role: "platform_admin" });
  if (!r.ok) {
    console.error("Email sudah terdaftar.");
    process.exit(1);
  }
  db.insert(auditLogs).values({ action: "buat_admin_platform", targetType: "user", targetId: r.userId, reason: "Provisioning internal (CLI)" }).run();
  console.info(`Admin platform dibuat: ${email.data}`);
  if (!values.password) console.info(`Password sementara (simpan sekarang, tidak ditampilkan lagi): ${password}`);
}

main();
