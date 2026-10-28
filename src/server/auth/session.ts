import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createSession, getSessionUser, revokeSession, type SessionUser } from "./service";

export const COOKIE_SESI = "ngebola_sesi";

/** User dari cookie sesi, sekali per request. null bila belum masuk atau sesi tidak berlaku. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE_SESI)?.value;
  return token ? getSessionUser(token) : null;
});

export async function startSession(userId: string) {
  const ua = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  const { token, expiresAt } = createSession(userId, ua);
  (await cookies()).set(COOKIE_SESI, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESI)?.value;
  if (token) revokeSession(token);
  jar.delete(COOKIE_SESI);
}
