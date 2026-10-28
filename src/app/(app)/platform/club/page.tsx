import type { Metadata } from "next";
import Link from "next/link";
import { asc, like, or, sql } from "drizzle-orm";
import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import { LambangClub } from "@/components/ngebola/club";
import { HeaderHalaman } from "@/components/ngebola/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { clubs } from "@/db/schema";
import { requireRole } from "@/server/authz";

export const metadata: Metadata = { title: "Semua club" };

export default async function Page({ searchParams }: PageProps<"/platform/club">) {
  await requireRole("platform_admin");
  const { cari } = await searchParams;
  const q = typeof cari === "string" ? cari.trim().toLowerCase() : "";
  const daftar = db
    .select()
    .from(clubs)
    .where(q ? or(like(sql`lower(${clubs.name})`, `%${q}%`), like(sql`lower(${clubs.area})`, `%${q}%`)) : undefined)
    .orderBy(asc(clubs.name))
    .limit(200)
    .all();
  return (
    <>
      <HeaderHalaman judul="Semua club" kembali="/platform/lainnya" />
      <form action="/platform/club" method="get" className="flex gap-2">
        <label className="flex h-[52px] flex-1 items-center rounded-full border-2 border-hijau bg-krem-terang px-4 has-[:focus-visible]:bg-white has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emas/60">
          <span className="sr-only">Cari club</span>
          <input name="cari" defaultValue={q} placeholder="Nama club atau area" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-placeholder" />
        </label>
        <Button variant="garis" type="submit">Cari</Button>
      </form>
      <ul className="flex flex-col gap-2">
        {daftar.map((c) => (
          <li key={c.id}>
            <Link href={`/platform/club/${c.id}`} className="flex items-center gap-3 rounded-besar border-2 border-hijau bg-krem-terang px-4 py-3 outline-none focus-visible:outline-3 focus-visible:outline-hijau">
              <LambangClub club={c} ukuran={32} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-extrabold">{c.name}</span>
                <span className="text-xs text-teks-2">{c.area}</span>
              </span>
              {c.suspendedAt ? (
                <Badge variant="bahaya">Ditangguhkan</Badge>
              ) : (
                <Badge variant={c.registrationStatus === "disetujui" ? "saran" : c.registrationStatus === "ditolak" ? "ditolak" : "menunggu"}>{c.registrationStatus}</Badge>
              )}
              <CaretRightIcon weight="bold" className="size-5 shrink-0 text-hijau" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
