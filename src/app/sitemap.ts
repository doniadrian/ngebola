import type { MetadataRoute } from "next";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { clubs } from "@/db/schema";
import { situsUrl } from "@/lib/situs";

// Dibaca dari database saat diminta (bukan saat build), supaya club baru langsung masuk.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const profil = db.select({ slug: clubs.slug, updatedAt: clubs.updatedAt }).from(clubs).where(and(eq(clubs.registrationStatus, "disetujui"), isNull(clubs.suspendedAt))).all();
  return [
    { url: situsUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: situsUrl("/jelajahi"), changeFrequency: "hourly", priority: 0.9 },
    { url: situsUrl("/leaderboard"), changeFrequency: "daily", priority: 0.8 },
    { url: situsUrl("/syarat-layanan"), changeFrequency: "yearly", priority: 0.2 },
    { url: situsUrl("/kebijakan-privasi"), changeFrequency: "yearly", priority: 0.2 },
    ...profil.map((c) => ({ url: situsUrl(`/profil-club/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
