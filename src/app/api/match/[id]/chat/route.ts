import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { getCurrentUser } from "@/server/auth/session";
import { chatAda, chatTerbuka, daftarPesan } from "@/server/chat";
import { clubMilik } from "@/server/club";
import { peserta } from "@/server/match";

// Polling chat match: hanya kedua Admin club peserta dan Admin platform (moderasi) — PRD 2, 8.3.
export async function GET(req: Request, ctx: RouteContext<"/api/match/[id]/chat">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  const m = db.select().from(matches).where(eq(matches.id, id)).get();
  if (!user || !m) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });
  const club = user.role === "club_admin" ? clubMilik(user.id) : null;
  const boleh = user.role === "platform_admin" || (!!club && peserta(m, club.id) && chatAda(m));
  if (!boleh) return Response.json({ error: "Tidak ditemukan" }, { status: 404 });

  const setelah = new URL(req.url).searchParams.get("setelah");
  const t = setelah ? new Date(setelah) : undefined;
  return Response.json({ pesan: daftarPesan(id, t && !Number.isNaN(t.getTime()) ? t : undefined), terbuka: chatTerbuka(m) }, { headers: { "Cache-Control": "no-store" } });
}
