import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { getCurrentUser } from "@/server/auth/session";
import { clubMilik } from "@/server/club";
import { keadaanSkor } from "@/server/domain/skor";
import { catatanSkor, sinkronSkor, type EntriKlien } from "@/server/hari-h";
import { peserta } from "@/server/match";

async function akses(id: string) {
  const user = await getCurrentUser();
  const m = db.select().from(matches).where(eq(matches.id, id)).get();
  if (!user || !m) return null;
  const club = user.role === "club_admin" ? clubMilik(user.id) : null;
  if (user.role !== "platform_admin" && !(club && peserta(m, club.id))) return null;
  return { user, m, club };
}

const keadaan = (m: typeof matches.$inferSelect) => {
  const catatan = catatanSkor(m.id);
  return { status: m.status, scorerClubId: m.scorerClubId, keadaan: keadaanSkor(catatan), konflik: catatan.filter((c) => c.conflict).length };
};

// Skor langsung untuk kedua admin peserta & Admin platform (tanpa pemantauan publik, PRD 1).
export async function GET(_req: Request, ctx: RouteContext<"/api/match/[id]/skor">) {
  const a = await akses((await ctx.params).id);
  if (!a) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
  return Response.json(keadaan(a.m), { headers: { "Cache-Control": "no-store" } });
}

// Sinkron catatan pencatat (juga antrean offline). Idempoten lewat clientEntryId.
export async function POST(req: Request, ctx: RouteContext<"/api/match/[id]/skor">) {
  const { id } = await ctx.params;
  const a = await akses(id);
  if (!a || a.user.role !== "club_admin") return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as { entri?: EntriKlien[] } | null;
  if (!body || !Array.isArray(body.entri) || body.entri.length > 200) return Response.json({ error: "Data tidak valid" }, { status: 400 });
  const r = await sinkronSkor(a.user.id, id, body.entri);
  if (!r.ok) return Response.json({ error: r.error }, { status: 409 });
  const m = db.select().from(matches).where(eq(matches.id, id)).get()!;
  return Response.json({ ...r, ...keadaan(m) });
}
