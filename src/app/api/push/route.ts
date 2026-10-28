import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getCurrentUser } from "@/server/auth/session";
import { kunciVapid } from "@/server/notify/push";

// Langganan Web Push terikat sesi (PRD 1): dicabut saat logout/reset; satu endpoint = satu langganan.
export async function GET() {
  return Response.json({ publicKey: kunciVapid()?.publicKey ?? null });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Belum masuk" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null;
  const endpoint = body?.endpoint;
  if (!endpoint || !/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !body?.keys?.p256dh || !body.keys.auth) {
    return Response.json({ error: "Langganan tidak valid" }, { status: 400 });
  }
  db.transaction((tx) => {
    tx.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)).run();
    tx.insert(pushSubscriptions).values({ userId: user.id, sessionId: user.sessionId, endpoint, p256dh: body.keys!.p256dh!.slice(0, 200), auth: body.keys!.auth!.slice(0, 100) }).run();
  });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Belum masuk" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (body?.endpoint) db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, body.endpoint), eq(pushSubscriptions.userId, user.id))).run();
  return Response.json({ ok: true });
}
