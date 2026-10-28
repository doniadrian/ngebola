import { timingSafeEqual } from "node:crypto";
import { jalankanBerkala } from "@/server/berkala";

// Dipanggil penjadwal (cron) server: Authorization: Bearer <CRON_SECRET>. Tanpa CRON_SECRET hanya boleh di development.
export async function POST(req: Request) {
  const rahasia = process.env.CRON_SECRET;
  const kiriman = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const sah = rahasia ? kiriman.length === rahasia.length && timingSafeEqual(Buffer.from(kiriman), Buffer.from(rahasia)) : process.env.NODE_ENV !== "production";
  if (!sah) return Response.json({ error: "Tidak diizinkan" }, { status: 401 });
  return Response.json(await jalankanBerkala());
}
