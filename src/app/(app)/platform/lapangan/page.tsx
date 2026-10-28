import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { CaretRightIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { HeaderHalaman } from "@/components/ngebola/header";
import { KartuKosong } from "@/components/ngebola/umpan-balik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { formatRupiah } from "@/lib/waktu";
import { requireRole } from "@/server/authz";

export const metadata: Metadata = { title: "Lapangan" };

export default async function Page() {
  await requireRole("platform_admin");
  const daftar = db.select().from(venues).orderBy(asc(venues.name)).all();
  return (
    <>
      <HeaderHalaman
        judul="Lapangan"
        aksi={
          <Button asChild size="k">
            <Link href="/platform/lapangan/baru">
              <PlusIcon weight="bold" aria-hidden />
              Tambah
            </Link>
          </Button>
        }
      />
      {daftar.length === 0 ? (
        <KartuKosong judul="Direktori lapangan kosong">Tambahkan lapangan supaya club bisa memilihnya saat membuat match.</KartuKosong>
      ) : (
        <ul className="flex flex-col gap-2">
          {daftar.map((v) => (
            <li key={v.id}>
              <Link href={`/platform/lapangan/${v.id}`} className="flex items-center gap-3 rounded-besar border-2 border-hijau bg-krem-terang px-4 py-3 outline-none focus-visible:outline-3 focus-visible:outline-hijau">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-extrabold">{v.name}</span>
                  <span className="truncate text-xs text-teks-2">
                    {v.area} · {[v.forFootball && "11v11", v.forMini && "Mini"].filter(Boolean).join(" & ")}
                    {v.pricePerHour ? ` · ${formatRupiah(v.pricePerHour)}/jam` : ""}
                  </span>
                </span>
                <Badge variant={v.verified ? "saran" : "menunggu"}>{v.verified ? "Terverifikasi" : "Belum"}</Badge>
                <CaretRightIcon weight="bold" className="size-5 shrink-0 text-hijau" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
