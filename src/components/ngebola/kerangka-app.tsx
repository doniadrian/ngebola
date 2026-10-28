import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { SignOutIcon } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"
import type { Peran } from "@/db/enums"
import { keluarAction } from "@/server/actions/auth"
import { BERANDA_PERAN } from "@/server/authz"
import type { Identitas } from "@/server/queries/identitas"
import { AvatarPemain } from "./avatar-pemain"
import { Lambang } from "./lambang"
import { NavBawah, SidebarNav, type JumlahNav } from "./navigasi"

/** Lambang club bila ada, selain itu avatar pengguna. */
export function TandaIdentitas({ identitas, ukuran = 44 }: { identitas: Identitas; ukuran?: number }) {
  const { club } = identitas
  if (club) return <Lambang nama={club.name} logo={club.logoPath} warna={club.crestColor} inisial={club.initials} ukuran={ukuran - 8} hiasan />
  return <AvatarPemain seed={identitas.avatarSeed ?? identitas.nama} nama={identitas.nama} ukuran={ukuran} />
}

// Kerangka halaman masuk: sidebar di desktop (≥ 768px), navigasi bawah di HP.
export function KerangkaApp({ peran, identitas, jumlah, children }: { peran: Peran; identitas: Identitas; jumlah?: JumlahNav; children: ReactNode }) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl gap-8 md:min-h-dvh md:px-6 md:py-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <nav aria-label="Navigasi utama" className="sticky top-6 flex flex-col gap-1.5 rounded-kartu border-2 border-tinta bg-krem-terang px-4 py-5">
            <Link href={BERANDA_PERAN[peran]} className="mx-1 mb-4 self-start rounded-kecil outline-none focus-visible:outline-3 focus-visible:outline-hijau">
              <Image src="/brand/ngebola-lockup-terang.svg" alt="Ngebola" width={120} height={32} className="h-8 w-auto" priority />
            </Link>
            <SidebarNav peran={peran} jumlah={jumlah} />
            <div className="mt-4.5 flex items-center gap-2.5 border-t-2 border-dashed border-nonaktif-tepi pt-3.5">
              <TandaIdentitas identitas={identitas} ukuran={40} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-extrabold">{identitas.club?.name ?? identitas.nama}</span>
                <span className="truncate text-xs text-teks-2">
                  {identitas.club ? `${identitas.namaDepan} · ${identitas.peranLabel}` : identitas.peranLabel}
                </span>
              </div>
            </div>
            <form action={keluarAction} className="mt-1">
              <Button variant="teks" size="k" className="px-1">
                <SignOutIcon weight="bold" aria-hidden />
                Keluar
              </Button>
            </form>
          </nav>
        </aside>
        <main id="konten" className="flex min-w-0 flex-1 flex-col gap-5 px-4 pt-4 pb-10 md:px-0 md:pt-0">
          {children}
        </main>
      </div>
      <NavBawah peran={peran} jumlah={jumlah} />
    </>
  )
}
