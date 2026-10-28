import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeftIcon, BellIcon } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"
import { TitikBaru } from "@/components/ui/badge"
import type { Identitas } from "@/server/queries/identitas"
import { TandaIdentitas } from "./kerangka-app"

// Navigasi.html "Header halaman · Beranda": sapaan + identitas + tombol pemberitahuan.
export function HeaderBeranda({ identitas, notifHref, aksi }: { identitas: Identitas; notifHref: string; aksi?: ReactNode }) {
  const adaNotif = identitas.belumDibaca > 0
  return (
    <header className="flex items-center gap-3">
      <TandaIdentitas identitas={identitas} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[13px] text-teks-2">Halo, {identitas.namaDepan}</span>
        <h1 className="truncate text-base font-extrabold md:text-xl">{identitas.club?.name ?? identitas.peranLabel}</h1>
      </div>
      {aksi}
      <Button asChild variant="garis" size="ikon">
        <Link href={notifHref} aria-label={adaNotif ? `Pemberitahuan, ${identitas.belumDibaca} belum dibaca` : "Pemberitahuan"}>
          <BellIcon weight="bold" />
          {adaNotif && <TitikBaru className="absolute -top-1.5 -right-1.5 size-3.5" label="" />}
        </Link>
      </Button>
    </header>
  )
}

// Judul halaman utama (Navigasi.html "Dengan pencarian": 24px hijau) atau halaman dalam dengan tombol kembali.
export function HeaderHalaman({ judul, kembali, aksi, children }: { judul: string; kembali?: string; aksi?: ReactNode; children?: ReactNode }) {
  if (kembali) {
    return (
      <header className="flex items-center gap-3">
        <Button asChild variant="garis" size="ikon">
          <Link href={kembali} aria-label="Kembali">
            <ArrowLeftIcon weight="bold" />
          </Link>
        </Button>
        <h1 className="flex-1 truncate text-center text-lg font-extrabold md:text-left md:text-2xl md:text-hijau">{judul}</h1>
        <div className="flex size-11 items-center justify-center">{aksi}</div>
      </header>
    )
  }
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-hijau md:text-[28px]">{judul}</h1>
        {aksi}
      </div>
      {children}
    </header>
  )
}
