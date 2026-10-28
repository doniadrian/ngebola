import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/server/auth/session"
import { BERANDA_PERAN } from "@/server/authz"
import { FooterPublik } from "./footer-publik"
import { MenuPublikHp } from "./menu-publik-hp"

const MENU = [
  { href: "/#cara-kerja", label: "Cara kerja" },
  { href: "/jelajahi", label: "Match terbuka", pendek: "Match" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/#faq", label: "FAQ" },
]

function ItemMenu({ m, aktif }: { m: (typeof MENU)[number]; aktif: boolean }) {
  return (
    <Link
      href={m.href}
      aria-current={aktif ? "page" : undefined}
      className={cn(
        "flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-tombol border-2 border-transparent px-2 text-[13px] font-semibold text-tinta outline-none transition-[translate,box-shadow,border-color,background-color] duration-200 ease-pegas hover:border-tinta hover:bg-krem-terang focus-visible:outline-3 focus-visible:outline-hijau tekan:translate-y-0.5 tekan:duration-60 md:px-3.5 md:text-[15px]",
        aktif && "border-tinta bg-krem-terang font-extrabold shadow-keras-sm shadow-emas"
      )}
    >
      {"pendek" in m ? (
        <>
          {m.pendek}
          <span className="sr-only md:not-sr-only">&nbsp;terbuka</span>
        </>
      ) : (
        m.label
      )}
    </Link>
  )
}

// Halaman untuk pengunjung tanpa akun (PRD 1): beranda, /jelajahi, /leaderboard, profil club publik.
export async function KerangkaPublik({ children, aktif, hero }: { children: ReactNode; aktif?: string; hero?: ReactNode }) {
  const user = await getCurrentUser()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-3 z-40 mx-auto w-full max-w-6xl px-3 pt-3 md:px-6">
        <div className="rounded-full border-2 border-tinta bg-krem-terang shadow-keras shadow-emas">
          <div className="flex h-16 items-center gap-2 pr-2.5 pl-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:pl-5">
            <Link href="/" className="rounded-kecil outline-none focus-visible:outline-3 focus-visible:outline-hijau lg:justify-self-start">
              <Image src="/brand/ngebola-lockup-terang.svg" alt="Ngebola" width={112} height={30} className="h-[30px] w-auto" priority />
            </Link>
            <nav aria-label="Menu publik" className="hidden gap-1 lg:flex">
              {MENU.map((m) => (
                <ItemMenu key={m.href} m={m} aktif={aktif === m.href} />
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-1.5 lg:justify-self-end">
              {user ? (
                <Button asChild size="k">
                  <Link href={BERANDA_PERAN[user.role]}>Buka Aplikasi</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="teks" size="k" className="hidden min-w-0 px-2 min-[420px]:inline-flex">
                    <Link href="/masuk">Masuk</Link>
                  </Button>
                  <Button asChild size="k">
                    <Link href="/daftar">Daftar</Link>
                  </Button>
                </>
              )}
              <MenuPublikHp menu={MENU} aktif={aktif} masuk={!!user} />
            </div>
          </div>
        </div>
      </header>
      {hero}
      <main id="konten" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-10">
        {children}
      </main>
      <FooterPublik masuk={!!user} rumah={user ? BERANDA_PERAN[user.role] : "/daftar"} />
    </div>
  )
}
