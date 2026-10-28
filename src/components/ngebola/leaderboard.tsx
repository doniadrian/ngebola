import Link from "next/link"
import { ArrowClockwiseIcon, ArrowRightIcon } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"
import { LABEL_FORMAT, type Format } from "@/db/enums"
import { cn } from "@/lib/utils"
import type { leaderboard } from "@/server/queries/publik"
import { IdentitasClub } from "./club"
import { MIN_PERINGKAT_RESMI } from "@/server/domain/reputasi"
import { PilihFormat, TAUTAN_PANAH } from "./seksi"
import { KartuKosong } from "./umpan-balik"

type Data = ReturnType<typeof leaderboard>
type Baris = Data["resmi"][number] | Data["sementara"][number]

// Satu tabel: baris resmi di atas, garis pemisah, lalu rating sementara. Desktop 8 kolom; di HP statistik turun ke baris kedua.
const KOLOM = "grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 md:grid-cols-[36px_minmax(0,1fr)_48px_32px_32px_32px_104px_64px] md:gap-x-3"

/** Progres menuju peringkat resmi: 5 kotak; jumlah juga tertulis supaya tidak hanya dibedakan warna. */
function Progres({ main }: { main: number }) {
  const isi = Math.min(main, MIN_PERINGKAT_RESMI)
  return (
    <span className="flex items-center gap-2" title={isi < MIN_PERINGKAT_RESMI ? `${isi} dari ${MIN_PERINGKAT_RESMI} hasil menuju peringkat resmi` : "Peringkat resmi"}>
      <span aria-hidden className="flex gap-1">
        {Array.from({ length: MIN_PERINGKAT_RESMI }, (_, i) => (
          <span key={i} className={cn("h-2 w-3 rounded-full border-[1.5px]", i < isi ? "border-hijau bg-hijau" : "border-nonaktif-tepi bg-nonaktif-bg")} />
        ))}
      </span>
      {isi < MIN_PERINGKAT_RESMI ? (
        <span className="text-[11px] font-bold text-emas-tua tabular-nums">
          {isi}/{MIN_PERINGKAT_RESMI}
          <span className="sr-only"> hasil, {MIN_PERINGKAT_RESMI - isi} lagi menuju peringkat resmi</span>
        </span>
      ) : (
        <span className="sr-only">resmi</span>
      )}
    </span>
  )
}

function BarisPeringkat({ r, resmi }: { r: Baris; resmi: boolean }) {
  const angka = (n: number, label: string) => (
    <span className="text-sm font-bold tabular-nums md:text-center">
      <span className="mr-1 text-[11px] font-semibold text-teks-2 md:hidden">{label}</span>
      {n}
    </span>
  )
  return (
    <li className={cn(KOLOM, "px-4 py-3 md:px-5", !resmi && "bg-krem/60")}>
      {resmi && "peringkat" in r ? (
        <span
          className={cn("flex size-8 items-center justify-center rounded-kecil border-2 border-tinta text-sm font-extrabold tabular-nums", r.peringkat === 1 ? "bg-emas" : "bg-krem")}
          aria-label={`Peringkat ${r.peringkat}`}
        >
          {r.peringkat}
        </span>
      ) : (
        <span className="text-center font-extrabold text-teks-2" aria-label="Belum berperingkat">·</span>
      )}
      <IdentitasClub club={r.club} ukuran={32} tautan className="min-w-0" />
      <span className="col-start-3 row-start-1 text-right text-lg font-extrabold tabular-nums md:col-start-8">{r.rating}</span>
      {/* Di HP: satu baris ringkas di bawah nama; di desktop: kolom masing-masing. */}
      <span className="col-span-2 col-start-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:contents">
        {angka(r.main, "Main")}
        {angka(r.menang, "M")}
        {angka(r.seri, "S")}
        {angka(r.kalah, "K")}
        <Progres main={r.main} />
      </span>
    </li>
  )
}

/** Tabel peringkat gabungan (resmi + sementara). */
function TabelPeringkat({ resmi, sementara, format }: { resmi: Baris[]; sementara: Baris[]; format: Format }) {
  return (
    <section aria-label={`Peringkat ${LABEL_FORMAT[format]}`} className="overflow-hidden rounded-kartu border-2 border-tinta bg-krem-terang shadow-keras">
      <div aria-hidden className={cn(KOLOM, "hidden border-b-2 border-nonaktif-tepi px-5 py-3 text-[11px] font-extrabold tracking-[.1em] text-teks-2 uppercase md:grid")}>
        <span>#</span>
        <span>Club</span>
        <span className="text-center">Main</span>
        <span className="text-center">M</span>
        <span className="text-center">S</span>
        <span className="text-center">K</span>
        <span>Progres</span>
        <span className="text-right">Rating</span>
      </div>
      <ol className="divide-y-2 divide-dashed divide-nonaktif-tepi">
        {resmi.map((r) => (
          <BarisPeringkat key={r.clubId} r={r} resmi />
        ))}
        {sementara.length > 0 && (
          <li className="bg-krem px-4 py-2.5 text-[11px] font-extrabold tracking-[.1em] text-emas-tua uppercase md:px-5">
            {resmi.length ? "Garis resmi · di bawah ini rating sementara" : `Rating sementara · kurang dari ${MIN_PERINGKAT_RESMI} hasil`}
          </li>
        )}
        {sementara.map((r) => (
          <BarisPeringkat key={r.clubId} r={r} resmi={false} />
        ))}
      </ol>
    </section>
  )
}

/** Penjelasan kenapa hanya sebagian club punya nomor peringkat (beranda & /leaderboard). */
export function CatatanPeringkat({ format, tautan = true }: { format: Format; tautan?: boolean }) {
  return (
    <aside className="flex flex-col gap-3 rounded-kartu border-2 border-tinta bg-krem-terang p-6">
      <h3 className="text-lg leading-snug font-extrabold">Kenapa tidak semua club punya nomor?</h3>
      <p className="text-[15px] leading-relaxed text-teks-2">
        Nomor peringkat resmi baru diberikan setelah 5 hasil terkonfirmasi di format yang sama. Sebelum itu, rating tampil sebagai sementara.
      </p>
      <p className="text-[15px] leading-relaxed text-teks-2">Rating memakai sistem Elo, mulai 1200, dan hanya dihitung dari hasil yang disetujui kedua club atau diputus Admin platform.</p>
      {tautan && (
        <Link href={`/leaderboard?format=${format}`} className={TAUTAN_PANAH}>
          Lihat leaderboard lengkap <ArrowRightIcon weight="bold" aria-hidden />
        </Link>
      )}
    </aside>
  )
}

/** Tab format (tautan) + daftar peringkat tanpa tabel geser (PRD 1). */
export function Leaderboard({ dasar, format, data, cari, ringkas }: { dasar: string; format: Format; data: Data; cari?: string; ringkas?: boolean }) {
  const href = (f: Format) => `${dasar}?format=${f}${cari ? `&cari=${encodeURIComponent(cari)}` : ""}`
  return (
    <div className="flex flex-col gap-5">
      <div className={cn("flex flex-wrap items-center justify-between gap-3", !ringkas && "rounded-kartu border-2 border-tinta bg-krem-terang p-3 shadow-keras shadow-emas md:p-4")}>
        {!ringkas && <PilihFormat aktif={format} href={href} />}
        {!ringkas && <form action={dasar} method="get" className="flex flex-1 items-center gap-2 md:max-w-sm">
          <input type="hidden" name="format" value={format} />
          <label className="flex h-12 flex-1 items-center rounded-full border-2 border-hijau bg-krem-terang px-4 has-[:focus-visible]:bg-white has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emas/60">
            <span className="sr-only">Cari club atau area</span>
            <input name="cari" defaultValue={cari} placeholder="Cari club atau area" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-placeholder" />
          </label>
          <Button asChild variant="garis" size="ikon">
            <Link href={href(format)} aria-label="Perbarui leaderboard">
              <ArrowClockwiseIcon weight="bold" />
            </Link>
          </Button>
        </form>}
      </div>

      {data.resmi.length === 0 && data.sementara.length === 0 ? (
        <KartuKosong judul="Belum ada hasil">Peringkat {LABEL_FORMAT[format]} muncul setelah ada hasil yang dikonfirmasi kedua club.</KartuKosong>
      ) : (
        <>
          <TabelPeringkat resmi={data.resmi} sementara={data.sementara} format={format} />
        </>
      )}
    </div>
  )
}
