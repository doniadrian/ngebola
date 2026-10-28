// Penjadwal berkala di proses server (satu instance SQLite): tenggat, WO, pengingat.
// Untuk deploy multi-instance/serverless, matikan dengan JADWAL_OTOMATIS=off dan panggil /api/cron dari cron server.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.JADWAL_OTOMATIS === "off" || process.env.NEXT_PHASE === "phase-production-build") return;
  const g = globalThis as unknown as { __ngebolaBerkala?: NodeJS.Timeout };
  if (g.__ngebolaBerkala) return;
  const { jalankanBerkala } = await import("./server/berkala");
  const jalan = () => jalankanBerkala().catch((e) => console.error("[berkala]", e));
  g.__ngebolaBerkala = setInterval(jalan, 60_000);
  void jalan();
}
