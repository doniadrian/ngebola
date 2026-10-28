"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarBlankIcon,
  DotsThreeOutlineIcon,
  GavelIcon,
  HouseIcon,
  MapPinIcon,
  SealCheckIcon,
  ShieldIcon,
  SoccerBallIcon,
  TrophyIcon,
  UserCircleIcon,
  UsersThreeIcon,
  type Icon,
} from "@phosphor-icons/react"
import { Hitungan } from "@/components/ui/badge"
import type { Peran } from "@/db/enums"
import { cn } from "@/lib/utils"

type Item = { href: string; label: string; Ikon: Icon; utama?: boolean }

// Lima tujuan per peran (PLAN.md bagian 3). Cari Lawan = bola menonjol di tengah, hanya Admin club.
export const NAV: Record<Peran, Item[]> = {
  club_admin: [
    { href: "/club", label: "Beranda", Ikon: HouseIcon },
    { href: "/club/jadwal", label: "Jadwal", Ikon: CalendarBlankIcon },
    { href: "/club/cari-lawan", label: "Cari Lawan", Ikon: SoccerBallIcon, utama: true },
    { href: "/club/skuad", label: "Skuad", Ikon: UsersThreeIcon },
    { href: "/club/profil", label: "Club", Ikon: ShieldIcon },
  ],
  player: [
    { href: "/pemain", label: "Beranda", Ikon: HouseIcon },
    { href: "/pemain/jadwal", label: "Jadwal", Ikon: CalendarBlankIcon },
    { href: "/pemain/peringkat", label: "Peringkat", Ikon: TrophyIcon },
    { href: "/pemain/skuad", label: "Skuad", Ikon: UsersThreeIcon },
    { href: "/pemain/profil", label: "Profil", Ikon: UserCircleIcon },
  ],
  platform_admin: [
    { href: "/platform", label: "Beranda", Ikon: HouseIcon },
    { href: "/platform/verifikasi", label: "Verifikasi", Ikon: SealCheckIcon },
    { href: "/platform/sengketa", label: "Sengketa", Ikon: GavelIcon },
    { href: "/platform/lapangan", label: "Lapangan", Ikon: MapPinIcon },
    { href: "/platform/lainnya", label: "Lainnya", Ikon: DotsThreeOutlineIcon },
  ],
}

const aktif = (pathname: string, href: string, beranda: string) =>
  href === beranda ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

/** Jumlah per href: angka merah = perlu ditanggapi. */
export type JumlahNav = Record<string, number>

// Navigasi.html "Navigasi bawah HP". Hanya di 5 halaman utama; halaman dalam memakai header dengan tombol kembali.
export function NavBawah({ peran, jumlah = {} }: { peran: Peran; jumlah?: JumlahNav }) {
  const pathname = usePathname()
  const items = NAV[peran]
  if (!items.some((i) => i.href === pathname)) return null

  return (
    <>
      <div aria-hidden className="h-[calc(112px+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-end border-t-2 border-tinta bg-krem-terang px-2 pt-3 pb-[max(26px,env(safe-area-inset-bottom))] md:hidden"
      >
        {items.map(({ href, label, Ikon, utama }) => {
          const on = aktif(pathname, href, items[0].href)
          if (utama) {
            return (
              <Link key={href} href={href} aria-current={on ? "page" : undefined} className="group flex min-h-12 flex-col items-center gap-1 text-tinta outline-none">
                <span className="-mt-10 flex size-[60px] items-center justify-center rounded-full border-2 border-tinta bg-hijau text-krem shadow-keras shadow-emas transition-[translate,box-shadow] duration-[240ms] ease-pegas tekan:duration-60 tekan:ease-out group-tekan:translate-y-1 group-tekan:shadow-none group-focus-visible:outline-3 group-focus-visible:outline-offset-3 group-focus-visible:outline-hijau">
                  <Ikon weight={on ? "fill" : "bold"} className="size-7" />
                </span>
                <span className="text-xs font-extrabold">{label}</span>
              </Link>
            )
          }
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn("group flex min-h-12 flex-col items-center gap-1 outline-none [&_svg]:transition-[scale] [&_svg]:duration-200 [&_svg]:ease-pegas tekan:[&_svg]:scale-85", on ? "text-tinta" : "text-teks-2")}
            >
              <span
                className={cn(
                  "relative flex h-8 w-[52px] items-center justify-center rounded-kecil group-focus-visible:outline-3 group-focus-visible:outline-hijau",
                  on && "border-[1.5px] border-tinta bg-emas"
                )}
              >
                <Ikon weight={on ? "fill" : "bold"} className={cn("size-[22px]", on && "text-hijau")} />
                <Hitungan jumlah={jumlah[href] ?? 0} className="absolute -top-[9px] -right-2" />
              </span>
              <span className={cn("text-xs", on ? "font-extrabold" : "font-semibold")}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

// Navigasi.html "Sidebar desktop": tautan aktif = isi hijau + bayangan emas.
export function SidebarNav({ peran, jumlah = {} }: { peran: Peran; jumlah?: JumlahNav }) {
  const pathname = usePathname()
  const items = NAV[peran]
  // Urutan desktop mengikuti referensi: Cari Lawan langsung setelah Beranda.
  const tampil = peran === "club_admin" ? [items[0], items[2], items[1], items[3], items[4]] : items

  return (
    <ul className="flex flex-col gap-1.5">
      {tampil.map(({ href, label, Ikon }) => {
        const on = aktif(pathname, href, items[0].href)
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex h-[46px] items-center gap-3 rounded-tombol border-2 px-3 transition-[background-color,box-shadow,color,border-color,scale] duration-200 tekan:scale-[.97] text-[15px] outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-hijau",
                on ? "border-hijau bg-hijau font-extrabold text-krem shadow-keras-sm shadow-emas" : "border-transparent font-semibold text-tinta hover:bg-krem"
              )}
            >
              <Ikon weight={on ? "fill" : "bold"} className="size-5 shrink-0" />
              <span className="flex-1">{label}</span>
              <Hitungan jumlah={jumlah[href] ?? 0} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
