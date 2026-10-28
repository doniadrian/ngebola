import type { ReactNode } from "react"
import Image from "next/image"
import { CalendarBlankIcon, MapPinIcon, TShirtIcon } from "@phosphor-icons/react/ssr"
import { cn } from "@/lib/utils"
import type { ClubPublik, StatistikClub } from "@/server/queries/club"
import { LATAR_LAPANGAN, Seksi } from "./seksi"
import { BadgeLevel, BadgeTerverifikasi, DaftarRiwayat, LambangClub, LimaLaga, PanelStatistik, PeringatanKeandalan } from "./club"

type Riwayat = Parameters<typeof DaftarRiwayat>[0]["riwayat"]

function Jersey({ warna, label }: { warna: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex size-7 items-center justify-center rounded-md border-2 border-tinta" style={{ backgroundColor: warna }} aria-hidden>
        <TShirtIcon weight="fill" className="size-4 text-tinta/25" />
      </span>
      {label}
    </span>
  )
}

/** Hero profil club: identitas di band hijau (pola halaman publik), aksi (mis. Tantang) di kanan. */
export function HeroProfilClub({ club, s, aksi }: { club: ClubPublik; s: StatistikClub; aksi?: ReactNode }) {
  return (
    <section aria-labelledby="h-club" className={cn("-mt-20 border-b-2 border-tinta pt-28 pb-24 text-krem md:pt-32 md:pb-28", LATAR_LAPANGAN)}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 md:flex-row md:items-end md:gap-7 md:px-6">
        <div className="w-fit rounded-kartu border-2 border-tinta bg-krem-terang p-2.5 shadow-keras shadow-emas md:p-3">
          <span className="md:hidden"><LambangClub club={club} ukuran={60} /></span>
          <span className="hidden md:block"><LambangClub club={club} ukuran={96} /></span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-[13px] font-extrabold tracking-[.12em] text-emas uppercase">Profil club</p>
          <h1 id="h-club" className="text-[34px] leading-[1.05] font-extrabold tracking-tight text-balance md:text-[52px]">{club.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {club.registrationStatus === "disetujui" && <BadgeTerverifikasi />}
            <BadgeLevel level={club.level} provisional={s.totalTerkonfirmasi < 5} />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-krem-redup">
            <span className="flex items-center gap-1.5">
              <MapPinIcon weight="bold" className="size-4 text-emas" aria-hidden />
              {club.area}, {club.city}
            </span>
            {club.foundedYear && (
              <span className="flex items-center gap-1.5">
                <CalendarBlankIcon weight="bold" className="size-4 text-emas" aria-hidden />
                Berdiri {club.foundedYear}
              </span>
            )}
            <Jersey warna={club.jerseyHome} label="Kandang" />
            <Jersey warna={club.jerseyAway} label="Tandang" />
          </div>
          {club.description && <p className="max-w-2xl text-base leading-relaxed text-krem-redup">{club.description}</p>}
        </div>
        {aksi && <div className="flex shrink-0 flex-wrap gap-3">{aksi}</div>}
      </div>
    </section>
  )
}

/**
 * Isi profil club publik. Tidak menampilkan data pemain, kontak pengurus, atau data akun (PRD 1, 4.4).
 */
export function ProfilClub({ club, s, riwayat, galeri, tambahan }: { club: ClubPublik; s: StatistikClub; riwayat: Riwayat; galeri: { id: string; path: string }[]; tambahan?: ReactNode }) {
  return (
    <>
      <div className="relative z-10 -mt-16 flex flex-col gap-3 md:-mt-20">
        <PanelStatistik s={s} />
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-teks-2">
          5 laga terakhir <LimaLaga hasil={s.limaTerakhir} />
        </div>
      </div>
      <PeringatanKeandalan s={s} />

      {tambahan}

      <Seksi id="hasil" kicker="Rekam jejak" judul="Hasil terakhir" ukuran="sedang">
        <DaftarRiwayat riwayat={riwayat} />
      </Seksi>

      {galeri.length > 0 && (
        <Seksi id="galeri" kicker="Dokumentasi" judul="Galeri club" ukuran="sedang">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {galeri.map((g) => (
              <li key={g.id} className="overflow-hidden rounded-besar border-2 border-tinta bg-krem shadow-keras-sm">
                <Image src={g.path} alt={`Foto ${club.name}`} width={400} height={300} className="aspect-[4/3] w-full object-cover" unoptimized />
              </li>
            ))}
          </ul>
        </Seksi>
      )}
    </>
  )
}
