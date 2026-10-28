import type { ReactNode } from "react"
import Link from "next/link"
import { CalendarBlankIcon, MapPinIcon, SealCheckIcon, WarningIcon } from "@phosphor-icons/react/ssr"
import { Badge } from "@/components/ui/badge"
import { LABEL_FORMAT, LABEL_LEVEL, type Format, type Level } from "@/db/enums"
import { cn } from "@/lib/utils"
import { formatJadwal, formatRupiah, formatTanggal } from "@/lib/waktu"
import type { MatchTerbuka } from "@/server/queries/publik"
import type { StatistikClub } from "@/server/queries/club"
import { Lambang } from "./lambang"

type ClubMini = { name: string; logoPath: string | null; crestColor: string; initials: string; slug?: string; area?: string }

export function LambangClub({ club, ukuran = 48 }: { club: ClubMini; ukuran?: number }) {
  return <Lambang nama={club.name} logo={club.logoPath} warna={club.crestColor} inisial={club.initials} ukuran={ukuran} hiasan />
}

/** Lambang + nama (+ area). Bila `tautan`, nama menuju profil publik club. */
export function IdentitasClub({ club, ukuran = 44, sub, tautan = false, className }: { club: ClubMini; ukuran?: number; sub?: ReactNode; tautan?: boolean; className?: string }) {
  const nama = <span className="truncate text-[15px] leading-tight font-extrabold">{club.name}</span>
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <LambangClub club={club} ukuran={ukuran} />
      <div className="flex min-w-0 flex-col gap-0.5">
        {tautan && club.slug ? (
          <Link href={`/profil-club/${club.slug}`} className="truncate rounded-sm underline-offset-4 outline-none hover:underline focus-visible:outline-3 focus-visible:outline-hijau">
            {nama}
          </Link>
        ) : (
          nama
        )}
        {(sub ?? club.area) && <span className="flex min-w-0 flex-col text-xs text-teks-2">{sub ?? <span className="truncate">{club.area}</span>}</span>}
      </div>
    </div>
  )
}

const WARNA_HASIL = { M: "bg-hijau text-krem", S: "bg-krem-terang text-tinta", K: "bg-merah text-white" }
const LABEL_HASIL = { M: "Menang", S: "Seri", K: "Kalah" }

/** "5 laga terakhir" (Kartu.html kartu tim): kotak kecil M/S/K, terbaru di kiri. Huruf + warna, bukan warna saja. */
export function LimaLaga({ hasil }: { hasil: ("M" | "S" | "K")[] }) {
  if (!hasil.length) return <span className="text-xs text-teks-2">Belum ada hasil</span>
  return (
    <ol className="flex gap-1" aria-label={`5 laga terakhir: ${hasil.map((h) => LABEL_HASIL[h]).join(", ")}`}>
      {hasil.map((h, i) => (
        <li key={i} aria-hidden className={cn("flex size-6 items-center justify-center rounded-md border-[1.5px] border-tinta text-[11px] font-extrabold", WARNA_HASIL[h])}>
          {h}
        </li>
      ))}
    </ol>
  )
}

function Angka({ label, nilai, sub, peringatan }: { label: string; nilai: ReactNode; sub?: ReactNode; peringatan?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-0.5 px-4 py-3.5 md:px-5 md:py-4", peringatan ? "bg-bg-error" : "bg-krem-terang")}>
      <dt className="text-xs font-bold text-teks-2">{label}</dt>
      <dd className={cn("text-[26px] leading-tight font-extrabold tabular-nums", peringatan ? "text-merah" : "text-hijau")}>{nilai}</dd>
      {sub && <dd className="text-xs text-teks-2">{sub}</dd>}
    </div>
  )
}

/** Statistik publik club (PRD C-03, 7.1–7.3). */
export function PanelStatistik({ s }: { s: StatistikClub }) {
  const rating = (f: Format) => {
    const r = s.rating[f]
    if (!r) return { nilai: "—", sub: "Belum ada hasil" }
    return { nilai: r.rating, sub: r.confirmedMatches < 5 ? `Sementara · ${r.confirmedMatches} hasil` : `${r.confirmedMatches} hasil` }
  }
  const k = s.keandalan
  return (
    <dl className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-kartu border-2 border-tinta bg-nonaktif-tepi shadow-keras shadow-emas md:grid-cols-3">
      <Angka label="Main" nilai={s.main} sub={`${s.menang} M · ${s.seri} S · ${s.kalah} K`} />
      <Angka label="Selisih gol" nilai={s.selisihGol > 0 ? `+${s.selisihGol}` : s.selisihGol} />
      <Angka label="Rating Mini soccer" {...rating("mini")} />
      <Angka label="Rating Football" {...rating("football")} />
      <Angka
        label="Keandalan"
        nilai={k.baru ? "Baru" : `${k.persen}%`}
        sub={k.baru ? "Kurang dari 5 match terjadwal" : k.peringatan ? "Sering batal mendadak / tidak hadir" : "20 match terjadwal terakhir"}
        peringatan={!k.baru && k.peringatan}
      />
      <Angka
        label="Sportivitas"
        nilai={s.sportivitas ? `${s.sportivitas.sportivitas.toLocaleString("id-ID")}/5` : "—"}
        sub={s.sportivitas ? `Kerapian ${s.sportivitas.kerapian.toLocaleString("id-ID")} · ${s.sportivitas.jumlah} penilaian` : "Belum ada penilaian"}
      />
    </dl>
  )
}

/** Peringatan keandalan < 60% (PRD 7.2) untuk profil & layar tantangan. */
export function PeringatanKeandalan({ s }: { s: StatistikClub }) {
  if (s.keandalan.baru || !s.keandalan.peringatan) return null
  return (
    <p role="status" className="flex items-start gap-2 rounded-tombol border-2 border-merah bg-bg-error px-3.5 py-2.5 text-[13px] font-bold text-merah">
      <WarningIcon weight="bold" className="mt-px size-4 shrink-0" aria-hidden />
      Keandalan {s.keandalan.persen}%: club ini sering batal mendadak atau tidak hadir.
    </p>
  )
}

type Riwayat = { id: string; format: Format; at: Date; musuh: ClubMini & { slug: string }; gol: number; kebobolan: number; hasil: "M" | "S" | "K" }

export function DaftarRiwayat({ riwayat, kosong = "Belum ada hasil terkonfirmasi." }: { riwayat: Riwayat[]; kosong?: string }) {
  if (!riwayat.length) return <p className="text-sm text-teks-2">{kosong}</p>
  return (
    <ul className="flex flex-col divide-y-2 divide-dashed divide-nonaktif-tepi rounded-kartu border-2 border-hijau bg-krem-terang px-4">
      {riwayat.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-3">
          <span aria-label={LABEL_HASIL[r.hasil]} className={cn("flex size-7 shrink-0 items-center justify-center rounded-md border-[1.5px] border-tinta text-xs font-extrabold", WARNA_HASIL[r.hasil])}>
            {r.hasil}
          </span>
          <IdentitasClub club={r.musuh} ukuran={28} tautan sub={`${formatTanggal(r.at)} · ${LABEL_FORMAT[r.format]}`} className="flex-1" />
          <span className="text-lg font-extrabold tabular-nums text-hijau">
            {r.gol}–{r.kebobolan}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function BadgeLevel({ level, provisional }: { level: Level; provisional?: boolean }) {
  return (
    <Badge variant={provisional ? "menunggu" : "netral"} title={provisional ? "Level sementara sampai 5 hasil terkonfirmasi" : undefined}>
      {LABEL_LEVEL[level]}
      {provisional && " · sementara"}
    </Badge>
  )
}

export function BadgeTerverifikasi() {
  return (
    <Badge variant="saran">
      <SealCheckIcon weight="fill" className="text-hijau" aria-hidden />
      Terverifikasi
    </Badge>
  )
}

const CHIP = "rounded-kecil border-[1.5px] border-nonaktif-tepi bg-krem px-2 py-0.5 text-xs font-bold text-tinta"

/** Kartu match terbuka (PRD 1): identitas, area, format, level, opsi jadwal, venue direktori, total biaya. Dipakai beranda, /jelajahi, Cari Lawan. */
export function KartuMatchTerbuka({ m, aksi }: { m: MatchTerbuka; aksi: ReactNode }) {
  const venue = m.opsi.find((o) => o.venueName)?.venueName
  const n = m.opsi.length
  return (
    <article className="flex h-full min-w-0 flex-1 flex-col rounded-kartu border-2 border-tinta bg-krem-terang shadow-keras">
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <LambangClub club={m.club} ukuran={42} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Link href={`/profil-club/${m.club.slug}`} className="text-lg leading-tight font-extrabold text-balance underline-offset-4 outline-none hover:underline focus-visible:outline-3 focus-visible:outline-hijau">
              {m.club.name}
            </Link>
            <span className="flex items-center gap-1 text-sm text-teks-2">
              <MapPinIcon weight="bold" className="size-3.5" aria-hidden />
              {m.match.area}
            </span>
          </div>
          <span className="shrink-0 rounded-kecil border-[1.5px] border-tinta bg-kuning-kartu px-2 py-0.5 text-xs font-bold">Cari lawan</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={CHIP}>{LABEL_FORMAT[m.match.format]}</span>
          <span className={CHIP}>Level {LABEL_LEVEL[m.match.level]}</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-besar bg-krem p-3.5">
          <ul className="flex flex-col gap-1.5" aria-label="Opsi jadwal">
            {m.opsi.slice(0, 3).map((o) => (
              <li key={o.startsAt.toISOString()} className="flex items-center gap-2 text-[15px] font-bold">
                <CalendarBlankIcon weight="bold" className="size-[18px] shrink-0 text-hijau" aria-hidden />
                {formatJadwal(o.startsAt)} WIB
              </li>
            ))}
          </ul>
          <span className="text-xs font-semibold text-emas-tua">{n > 1 ? `${n} opsi jadwal · lawan memilih satu` : "1 opsi jadwal"}</span>
        </div>
        <span className="flex items-center gap-2 text-sm text-teks-2">
          <MapPinIcon weight="bold" className="size-4 shrink-0 text-hijau" aria-hidden />
          {venue ?? "Lapangan menyusul"}
        </span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-t-2 border-dashed border-nonaktif-tepi px-5 py-4">
        <span className="flex flex-col">
          <span className="text-xs text-teks-2">Total biaya lapangan</span>
          <span className="text-xl font-extrabold tabular-nums text-hijau">{m.match.feeTotal ? formatRupiah(m.match.feeTotal) : "Belum diisi"}</span>
        </span>
        {aksi}
      </div>
    </article>
  )
}
