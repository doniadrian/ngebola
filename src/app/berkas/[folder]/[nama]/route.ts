import { eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { bolehLihatPemain } from "@/server/akses";
import { getCurrentUser } from "@/server/auth/session";
import { bacaBerkas } from "@/server/berkas";

// Logo & galeri club bersifat publik. Foto pemain hanya untuk yang berhak melihat profilnya (PRD 4.4).
export async function GET(_req: Request, ctx: RouteContext<"/berkas/[folder]/[nama]">) {
  const { folder, nama } = await ctx.params;
  const path = `/berkas/${folder}/${nama}`;
  const berkas = bacaBerkas(path);
  if (!berkas) return new Response("Tidak ditemukan", { status: 404 });

  if (berkas.folder === "pemain") {
    const pemilik = db.select({ userId: players.userId }).from(players).where(eq(players.photoPath, path)).get();
    if (!pemilik || !bolehLihatPemain(await getCurrentUser(), pemilik.userId)) return new Response("Tidak ditemukan", { status: 404 });
  }

  return new Response(new Uint8Array(berkas.isi), {
    headers: {
      "Content-Type": berkas.mime,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": berkas.folder === "pemain" ? "private, max-age=300" : "public, max-age=31536000, immutable",
    },
  });
}
