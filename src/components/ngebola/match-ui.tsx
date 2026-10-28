import type { ReactNode } from "react"
import Link from "next/link"
import { CaretRightIcon, MapPinIcon, SealWarningIcon } from "@phosphor-icons/react/ssr"
import { LABEL_FORMAT, LABEL_LEVEL, type Format, type Level, type StatusMatch } from "@/db/enums"
import { cn } from "@/lib/utils"
import { formatJam, formatRupiah, ZONA } from "@/lib/waktu"
import { BadgeStatus } from "./badge-status"
import { LambangClub } from "./club"

type ClubMini = { name: string; logoPath: string | null; crestColor: string; initials: string; slug?: string }

const fmtHari = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, weekday: "short" })
const fmtTgl = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, day: "numeric" })
const fmtBln = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, month: "short" })

/** Blok tanggal (Kartu.html "Daftar jadwal"): SAB / 31 / OKT. */
export function BlokTanggal({ at, redup }: { at: Date | null; redup?: boolean }) {
  return (
    <span className={cn("flex w-14 shrink-0 flex-col items-center rounded-besar border-2 py-1.5 leading-none", redup ? "border-nonaktif-tepi text-teks-2" : "border-hijau text-hijau")}>
      {at ? (
        <>
          <span className="text-[11px] font-extrabold uppercase">{fmtHari.format(at).replace(".", "")}</span>
          <span className="text-[22px] font-extrabold">{fmtTgl.format(at)}</span>
          <span className="text-[11px] font-extrabold uppercase">{fmtBln.format(at).replace(".", "")}</span>
        </>
      ) : (
        <span className="py-2 text-xs font-bold">—</span>
      )}
    </span>
  )
}

/** Baris jadwal yang bisa diketuk. */
export function BarisJadwal({ href, at, lawan, sub, status, label, tambahan }: { href: string; at: Date | null; lawan: string; sub: string; status: StatusMatch; label?: string; tambahan?: ReactNode }) {
  const lewat = ["selesai", "ditolak", "kedaluwarsa", "dibatalkan", "wo"].includes(status)
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-kartu border-2 border-hijau bg-krem-terang p-3 shadow-keras transition-[translate,box-shadow] duration-[240ms] ease-pegas tekan:duration-60 tekan:ease-out outline-none tekan:translate-y-1 tekan:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-hijau md:p-4"
      >
        <BlokTanggal at={at} redup={lewat} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="line-clamp-2 text-[15px] leading-snug font-extrabold">{lawan}</span>
          <span className="line-clamp-2 text-[13px] text-teks-2">{sub}</span>
          <span className="flex flex-wrap items-center gap-2">
            <BadgeStatus status={status} label={label} />
            {tambahan}
          </span>
        </span>
        <CaretRightIcon weight="bold" className="size-5 shrink-0 text-hijau" aria-hidden />
      </Link>
    </li>
  )
}

/** Kepala detail match: dua lambang berhadapan (Kartu.html "Ajakan sparring masuk"). */
function SisiMatch({ c, tautan }: { c: ClubMini | null; tautan: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      {c ? (
        <LambangClub club={c} ukuran={64} />
      ) : (
        <span className="flex h-[74px] w-16 items-center justify-center rounded-[14px_14px_26px_26px] border-2 border-dashed border-nonaktif-tepi text-2xl font-extrabold text-teks-2">?</span>
      )}
      {tautan && c?.slug ? (
        <Link href={`/profil-club/${c.slug}`} className="line-clamp-2 text-sm leading-tight font-extrabold underline-offset-4 hover:underline">
          {c.name}
        </Link>
      ) : (
        <span className="line-clamp-2 text-sm leading-tight font-extrabold">{c?.name ?? "Mencari lawan"}</span>
      )}
    </div>
  )
}

/** `tanpaTautan`: nama club bukan tautan (dipakai bila seluruh kartu sudah berupa tautan). */
export function KepalaMatch({ pembuat, lawan, status, format, level, labelStatus, sub, tanpaTautan = false }: { pembuat: ClubMini; lawan: ClubMini | null; status: StatusMatch; format: Format; level: Level; labelStatus?: string; sub?: ReactNode; tanpaTautan?: boolean }) {
  return (
    <section className="flex flex-col gap-4 rounded-kartu border-2 border-hijau bg-krem-terang p-5">
      <div className="flex items-center justify-between gap-2">
        <BadgeStatus status={status} label={labelStatus} />
        <span className="text-[13px] font-bold text-teks-2">
          {LABEL_FORMAT[format]} · {LABEL_LEVEL[level]}
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-besar bg-krem px-2 py-4">
        <SisiMatch c={pembuat} tautan={!tanpaTautan} />
        <span className="text-lg font-extrabold text-emas-tua">VS</span>
        <SisiMatch c={lawan} tautan={!tanpaTautan} />
      </div>
      {sub}
    </section>
  )
}

type Lap = { venueName?: string | null; venueVerified?: boolean | null; manualName?: string | null; manualAddress?: string | null; alamatVenue?: string | null; lat?: number | null; lng?: number | null }

/** Lapangan direktori atau manual ("belum terverifikasi", S-02). Alamat manual hanya untuk peserta. */
export function InfoLapangan({ l, alamat = true }: { l: Lap; alamat?: boolean }) {
  const nama = l.venueName ?? l.manualName
  if (!nama) return <span className="text-sm text-teks-2">Lapangan belum ditentukan</span>
  const peta = l.lat != null && l.lng != null ? `https://www.google.com/maps?q=${l.lat},${l.lng}` : null
  return (
    <span className="flex items-start gap-2 text-sm">
      <MapPinIcon weight="bold" className="mt-0.5 size-[18px] shrink-0 text-hijau" aria-hidden />
      <span className="flex flex-col gap-0.5">
        <span className="font-bold">
          {peta ? (
            <a href={peta} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              {nama}
            </a>
          ) : (
            nama
          )}
        </span>
        {alamat && (l.alamatVenue ?? l.manualAddress) && <span className="text-[13px] text-teks-2">{l.alamatVenue ?? l.manualAddress}</span>}
        {(l.manualName || l.venueVerified === false) && (
          <span className="flex items-center gap-1 text-xs font-bold text-emas-tua">
            <SealWarningIcon weight="bold" className="size-3.5" aria-hidden />
            Belum terverifikasi
          </span>
        )}
      </span>
    </span>
  )
}

export const ringkasJadwal = (at: Date | null, venue: string | null | undefined) => [at ? `${formatJam(at)} WIB` : "Jadwal belum dipilih", venue].filter(Boolean).join(" · ")
export const teksBiaya = (fee: number | null) => (fee ? `Total biaya lapangan ${formatRupiah(fee)}` : "Biaya lapangan belum diisi")
