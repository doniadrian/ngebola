import type { ReactNode } from "react"
import Link from "next/link"
import { FORMAT, LABEL_FORMAT, type Format } from "@/db/enums"
import { cn } from "@/lib/utils"

// Pola halaman publik (mengikuti beranda): band hijau bergaris di bawah header pil, kicker + judul besar per section.
export const LATAR_LAPANGAN = "bg-[repeating-linear-gradient(90deg,var(--color-hijau)_0_100px,var(--color-hijau-garis)_100px_200px)]"
export const KICKER = "text-[13px] font-extrabold tracking-[.12em] text-emas-tua uppercase"
export const TAUTAN_PANAH = "inline-flex w-fit items-center gap-1.5 text-[15px] font-bold text-hijau underline decoration-2 underline-offset-4 outline-none hover:text-hijau-tua focus-visible:outline-3 focus-visible:outline-hijau"

const H2 = {
  besar: "text-[30px] leading-[1.08] md:text-[44px]",
  sedang: "text-2xl leading-tight md:text-[30px]",
}

/** Kicker + judul section (h2). */
export function JudulSeksi({ id, kicker, judul, aksi, ukuran = "besar" }: { id: string; kicker: string; judul: string; aksi?: ReactNode; ukuran?: keyof typeof H2 }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-3xl flex-col gap-2">
        <p className={KICKER}>{kicker}</p>
        <h2 id={id} className={cn("font-extrabold tracking-tight text-balance text-hijau", H2[ukuran])}>{judul}</h2>
      </div>
      {aksi}
    </div>
  )
}

/** Section publik: judul + isi, muncul saat digulir. */
export function Seksi({ id, judul, kicker, aksi, ukuran = "besar", className, children }: { id: string; judul: string; kicker: string; aksi?: ReactNode; ukuran?: keyof typeof H2; className?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`h-${id}`} className={cn("muncul flex scroll-mt-28 flex-col", ukuran === "besar" ? "mt-10 gap-7 md:mt-20" : "mt-6 gap-5 md:mt-10", className)}>
      <JudulSeksi id={`h-${id}`} kicker={kicker} judul={judul} aksi={aksi} ukuran={ukuran} />
      {children}
    </section>
  )
}

/**
 * Hero halaman dalam publik: band hijau selebar layar, header pil mengambang di atasnya.
 * `tumpang`: ruang bawah ekstra supaya elemen pertama konten bisa menumpang di tepi band (pakai `-mt-16 md:-mt-20`).
 */
export function HeroHalaman({ kicker, judul, children, aksi, tumpang = false }: { kicker: string; judul: ReactNode; children?: ReactNode; aksi?: ReactNode; tumpang?: boolean }) {
  return (
    <section aria-labelledby="h-halaman" className={cn("-mt-20 border-b-2 border-tinta pt-28 text-krem md:pt-32", tumpang ? "pb-24 md:pb-28" : "pb-12 md:pb-16", LATAR_LAPANGAN)}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 md:flex-row md:items-end md:justify-between md:px-6">
        <div className="flex max-w-3xl min-w-0 flex-col gap-3">
          <p className="text-[13px] font-extrabold tracking-[.12em] text-emas uppercase">{kicker}</p>
          <h1 id="h-halaman" className="text-[34px] leading-[1.05] font-extrabold tracking-tight text-balance md:text-[52px]">{judul}</h1>
          {children && <div className="text-base leading-relaxed text-krem-redup md:text-lg">{children}</div>}
        </div>
        {aksi && <div className="flex shrink-0 flex-wrap gap-3">{aksi}</div>}
      </div>
    </section>
  )
}

/** Sakelar format (Mini soccer / Football 11v11) sebagai tautan, agar bisa dibagikan. */
export function PilihFormat({ aktif, href, scroll = true }: { aktif: Format; href: (f: Format) => string; scroll?: boolean }) {
  return (
    <nav aria-label="Format" className="flex w-fit shrink-0 rounded-tombol border-2 border-tinta bg-krem-terang p-1">
      {[...FORMAT].reverse().map((f) => (
        <Link
          key={f}
          href={href(f)}
          scroll={scroll}
          aria-current={f === aktif ? "page" : undefined}
          className={cn(
            "flex min-h-10 items-center rounded-kecil px-4 text-sm font-bold whitespace-nowrap outline-none focus-visible:outline-3 focus-visible:outline-hijau",
            f === aktif ? "bg-hijau text-krem" : "text-tinta hover:bg-krem",
          )}
        >
          {LABEL_FORMAT[f]}
        </Link>
      ))}
    </nav>
  )
}
