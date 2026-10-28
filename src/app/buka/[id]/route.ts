import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/server/auth/session";

// Buka notifikasi: tandai dibaca lalu arahkan ke tautannya (hanya path internal milik pengguna itu).
export async function GET(req: Request, ctx: RouteContext<"/buka/[id]">) {
  const user = await getCurrentUser();
  if (!user) return Response.redirect(new URL("/masuk", req.url), 303);
  const { id } = await ctx.params;
  const n = db.select().from(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, user.id))).get();
  if (!n) return Response.redirect(new URL("/", req.url), 303);
  if (!n.readAt) db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id)).run();
  const tujuan = n.url && /^\/(?![/\\])/.test(n.url) ? n.url : "/";
  return Response.redirect(new URL(tujuan, req.url), 303);
}
