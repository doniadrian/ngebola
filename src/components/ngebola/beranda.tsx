import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRightIcon, CalendarBlankIcon, ChartLineUpIcon, CheckIcon, ClipboardTextIcon, HandshakeIcon, MagnifyingGlassIcon,
  MapPinIcon, ScalesIcon, SealCheckIcon, ShieldCheckIcon, SoccerBallIcon, StarIcon, TShirtIcon, UsersThreeIcon,
} from "@phosphor-icons/react/ssr"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { AREA, LABEL_FORMAT, LABEL_STATUS_MATCH, type Format } from "@/db/enums"
import { FAQ } from "@/lib/faq"
import { PEMAIN_AKTIF } from "@/lib/fitur"
import { cn } from "@/lib/utils"
import { formatJadwal } from "@/lib/waktu"
import type { HasilTerbaru, MatchTerbuka } from "@/server/queries/publik"
import { KartuMatchTerbuka, LambangClub } from "./club"
import { CatatanPeringkat } from "./leaderboard"
import { JudulSeksi, LATAR_LAPANGAN, PilihFormat, Seksi, TAUTAN_PANAH } from "./seksi"
import { KartuKosong } from "./umpan-balik"

/* ── Hero ─────────────────────────────────────────────────────────────── */

function KartuMelayang({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("absolute rounded-besar border-2 border-tinta bg-krem-terang p-4 text-tinta shadow-keras shadow-emas", className)}>{children}</div>
}

/** Hero hijau selebar layar; header pil mengambang di atasnya. Kartu contoh memakai data nyata (bila ada). */
export function Hero({ masuk, rumah, contoh, hasil }: { masuk: boolean; rumah: string; contoh?: MatchTerbuka; hasil: HasilTerbaru | null }) {
  return (
    <section aria-labelledby="h-hero" className={cn("-mt-20 border-b-2 border-tinta pt-28 pb-28 text-krem md:pt-36 md:pb-36", LATAR_LAPANGAN)}>
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 md:grid-cols-[1.15fr_1fr] md:px-6">
        <div className="flex flex-col gap-6">
          <p className="flex w-fit items-center gap-2 rounded-tombol border-2 border-emas px-3 py-1.5 text-[12px] font-extrabold tracking-[.08em] text-emas uppercase">
            <MapPinIcon weight="bold" className="size-4 shrink-0" aria-hidden />
            Gratis · Pekanbaru<span className="hidden sm:inline"> · 11v11 & mini soccer</span>
          </p>
          <h1 id="h-hero" className="text-[38px] leading-[1.02] font-extrabold tracking-tight text-balance md:text-[64px]">
            Cari lawan sparring di Pekanbaru.
            <span className="mt-1 block text-emas">Hasil tercatat, reputasi terbukti.</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-krem-redup md:text-lg">
            Temukan club setara, sepakati jadwal dan lapangan, catat skor, lalu bangun rating club dari hasil yang dikonfirmasi kedua pihak.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild permukaan="gelap" size="b">
              <Link href={masuk ? rumah : "/daftar?peran=club_admin"}>
                {masuk ? "Buka aplikasi" : "Daftarkan club"}
                <ArrowRightIcon weight="bold" aria-hidden />
              </Link>
            </Button>
            <Button asChild permukaan="gelap" variant="garis" size="b">
              <Link href="/jelajahi">Lihat match terbuka</Link>
            </Button>
          </div>
        </div>

        <div aria-hidden className="relative hidden h-[460px] md:block">
          <Image src="/brand/pakbola-maskot-gelap.png" alt="" width={420} height={420} className="absolute right-0 bottom-0 h-[440px] w-auto" priority />
          {contoh && (
            <KartuMelayang className="top-0 left-0 w-[310px] -rotate-3">
              <div className="flex items-start gap-3">
                <LambangClub club={contoh.club} ukuran={38} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] leading-tight font-extrabold">{contoh.club.name}</span>
                  <span className="text-xs text-teks-2">{contoh.match.area}</span>
                </div>
                <span className="shrink-0 rounded-kecil border-[1.5px] border-tinta bg-kuning-kartu px-2 py-0.5 text-xs font-bold">Cari lawan</span>
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm font-bold">
                <CalendarBlankIcon weight="bold" className="size-4 text-hijau" />
                {formatJadwal(contoh.opsi[0].startsAt)} WIB
              </p>
            </KartuMelayang>
          )}
          {hasil && (
            <KartuMelayang className="bottom-6 left-8 w-[300px] rotate-2">
              <p className="text-[11px] font-extrabold tracking-[.1em] text-emas-tua uppercase">Hasil terbaru · {LABEL_FORMAT[hasil.format]}</p>
              {([
                [hasil.pembuat, hasil.skor[0]],
                [hasil.lawan, hasil.skor[1]],
              ] as const).map(([c, n]) => (
                <div key={c.id} className="mt-2 flex items-center gap-2.5">
                  <LambangClub club={c} ukuran={28} />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{c.name}</span>
                  <span className={cn("text-xl font-extrabold tabular-nums", n === Math.max(...hasil.skor) ? "text-hijau" : "text-teks-2")}>{n}</span>
                </div>
              ))}
              <p className="mt-3 flex items-center gap-1.5 border-t-2 border-dashed border-nonaktif-tepi pt-2.5 text-xs font-bold text-hijau">
                <SealCheckIcon weight="bold" className="size-4" />
                Dikonfirmasi kedua club
              </p>
            </KartuMelayang>
          )}
        </div>
      </div>
    </section>
  )
}

/* ── Angka & area ─────────────────────────────────────────────────────── */

export function StripAngka({ s }: { s: { club: number; matchSelesai: number; lapangan: number; area: number } }) {
  const item: [number, string][] = [[s.club, "club terverifikasi"], [s.matchSelesai, "match selesai"], [s.lapangan, "lapangan terdaftar"], [s.area, "kecamatan tercakup"]]
  return (
    <section aria-label="Ngebola dalam angka" className="relative z-10 -mt-24 flex flex-col gap-5 md:-mt-28">
      <dl className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-kartu border-2 border-tinta bg-nonaktif-tepi shadow-keras shadow-emas md:grid-cols-4">
        {item.map(([n, label]) => (
          <div key={label} className="flex flex-col gap-1 bg-krem-terang px-5 py-4 md:px-7 md:py-6">
            <dd className="order-1 text-4xl leading-none font-extrabold tabular-nums text-hijau md:text-5xl">{n}</dd>
            <dt className="order-2 text-sm font-semibold text-teks-2 md:text-base">{label}</dt>
          </div>
        ))}
      </dl>
      <nav aria-label="Cari lawan per kecamatan" className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        <span className="mr-1 shrink-0 text-sm font-bold text-emas-tua">Cari lawan di</span>
        {AREA.map((a) => (
          <Link
            key={a}
            href={`/jelajahi?area=${encodeURIComponent(a)}`}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-tombol border-2 border-nonaktif-tepi bg-krem-terang px-3 text-[13px] font-semibold text-tinta outline-none transition-colors hover:border-tinta focus-visible:outline-3 focus-visible:outline-hijau"
          >
            <MapPinIcon weight="bold" className="size-3.5 text-hijau" aria-hidden />
            {a}
          </Link>
        ))}
      </nav>
    </section>
  )
}

/* ── Cara kerja ───────────────────────────────────────────────────────── */

const LANGKAH = [
  { Ikon: MagnifyingGlassIcon, judul: "Cari lawan", isi: "Jelajahi match terbuka atau tantang club langsung dari profilnya. Saring menurut area, format, dan level.", status: "terbuka", warna: "bg-kuning-kartu border-tinta" },
  { Ikon: HandshakeIcon, judul: "Sepakati jadwal & lapangan", isi: "Ajukan sampai tiga opsi jadwal dan lapangan. Perubahan hanya berlaku setelah disetujui kedua club.", status: "terkonfirmasi", warna: "bg-krem-terang border-nonaktif-tepi" },
  { Ikon: SoccerBallIcon, judul: "Main & catat skor", isi: "Check-in di hari H, lalu catat skor akhir. Pencatat skor tetap jalan walau sinyal di lapangan lemah.", status: "berlangsung", warna: "bg-emas border-tinta" },
  { Ikon: ShieldCheckIcon, judul: "Konfirmasi hasil", isi: "Club lawan menyetujui skor. Setelah itu rating dan statistik kedua club diperbarui.", status: "selesai", warna: "bg-hijau border-tinta text-krem" },
] as const

export function CaraKerja() {
  return (
    <Seksi id="cara-kerja" kicker="Cara kerja" judul="Dari cari lawan sampai rating, empat langkah.">
      <ol className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-6">
        {LANGKAH.map(({ Ikon, judul, isi, status, warna }, i) => (
          <li
            key={judul}
            className={cn(
              // Garis putus-putus penghubung: vertikal di HP, horizontal di desktop.
              "relative grid grid-cols-[56px_1fr] gap-x-4 gap-y-1 md:flex md:flex-col md:gap-3",
              "before:absolute before:top-16 before:-bottom-6 before:left-7 before:border-l-2 before:border-dashed before:border-emas last:before:hidden",
              "md:before:top-7 md:before:right-0 md:before:bottom-auto md:before:left-16 md:before:border-t-2 md:before:border-l-0 md:last:before:block",
            )}
          >
            <span className={cn("row-span-4 flex size-14 items-center justify-center rounded-tombol border-2 border-tinta shadow-keras-sm", i === 3 ? "bg-hijau text-emas" : "bg-emas text-hijau")}>
              <Ikon weight="bold" className="size-6" aria-hidden />
            </span>
            <span className="text-[13px] font-bold text-emas-tua">Langkah {i + 1}</span>
            <h3 className="text-xl leading-tight font-extrabold">{judul}</h3>
            <p className="text-[15px] leading-relaxed text-teks-2">{isi}</p>
            <span className={cn("mt-1 w-fit rounded-kecil border-[1.5px] px-2 py-0.5 text-xs font-extrabold", warna)}>
              Status: {LABEL_STATUS_MATCH[status]}
            </span>
          </li>
        ))}
      </ol>
    </Seksi>
  )
}

/* ── Match terbuka ────────────────────────────────────────────────────── */

export function MatchTerbukaRingkas({ data }: { data: MatchTerbuka[] }) {
  return (
    <Seksi
      id="match-terbuka"
      kicker="Sedang mencari lawan"
      judul="Match terbuka di Pekanbaru"
      aksi={
        <Link href="/jelajahi" className={TAUTAN_PANAH}>
          Lihat semua match <ArrowRightIcon weight="bold" aria-hidden />
        </Link>
      }
    >
      {data.length ? (
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-1 pb-3 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
          {data.map((m) => (
            <div key={m.match.id} className="flex w-[86%] shrink-0 snap-start md:w-auto">
              <KartuMatchTerbuka m={m} aksi={<Button asChild variant="garis" size="k"><Link href="/jelajahi">Lihat detail</Link></Button>} />
            </div>
          ))}
        </div>
      ) : (
        <KartuKosong
          judul="Belum ada match terbuka"
          aksi={
            <Button asChild size="k">
              <Link href="/daftar?peran=club_admin">Daftarkan club</Link>
            </Button>
          }
        >
          Club terverifikasi yang sedang mencari lawan akan muncul di sini. Jadilah yang pertama membuka match.
        </KartuKosong>
      )}
    </Seksi>
  )
}

/* ── Kenapa bisa dipercaya ────────────────────────────────────────────── */

const BENTO = [
  { Ikon: ChartLineUpIcon, judul: "Rating Elo per format", isi: "Mulai dari 1200. Peringkat resmi setelah 5 hasil, terpisah untuk 11v11 dan mini soccer." },
  { Ikon: ClipboardTextIcon, judul: "Skor keandalan", isi: "Hadir tepat waktu dan konfirmasi cepat menaikkan reputasi. Tidak datang menurunkannya." },
  { Ikon: StarIcon, judul: "Penilaian sportivitas", isi: "Setelah match, kedua club saling menilai. Nilainya tampil di profil club." },
  { Ikon: ScalesIcon, judul: "Sengketa ditangani manusia", isi: "Skor berbeda? Kirim bukti. Admin platform memutus, dan semua keputusan tercatat di log audit." },
]

export function KenapaPercaya({ hasil }: { hasil: HasilTerbaru | null }) {
  return (
    <Seksi id="kenapa-percaya" kicker="Kenapa bisa dipercaya" judul="Reputasi dibangun dari hasil, bukan klaim.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.15fr_1fr_1fr] md:gap-5">
        <div className="flex flex-col gap-4 rounded-kartu border-2 border-tinta bg-hijau p-6 text-krem shadow-keras shadow-emas md:row-span-2 md:p-8">
          <span className="flex size-12 items-center justify-center rounded-tombol border-2 border-tinta bg-emas text-hijau">
            <ShieldCheckIcon weight="bold" className="size-6" aria-hidden />
          </span>
          <h3 className="text-2xl leading-tight font-extrabold md:text-[28px]">Hasil dikonfirmasi dua club</h3>
          <p className="text-[15px] leading-relaxed text-krem-redup md:text-base">Skor baru dihitung setelah club lawan menyetujuinya. Tidak ada klaim sepihak.</p>
          {hasil && (
            <ul aria-label="Contoh hasil yang disetujui kedua club" className="mt-auto flex flex-col gap-2 pt-4">
              {[hasil.pembuat, hasil.lawan].map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-tombol bg-krem/10 px-3.5 py-3">
                  <LambangClub club={c} ukuran={26} />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-bold">{c.name}</span>
                  <span className="flex shrink-0 items-center gap-1 text-[13px] font-extrabold text-emas">
                    <CheckIcon weight="bold" aria-hidden />
                    Setuju {hasil.skor[0]}–{hasil.skor[1]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {BENTO.map(({ Ikon, judul, isi }) => (
          <div key={judul} className="flex flex-col gap-2 rounded-kartu border-2 border-tinta bg-krem-terang p-5 md:gap-2.5 md:p-6">
            <Ikon weight="bold" className="size-7 text-hijau" aria-hidden />
            <h3 className="text-lg font-extrabold">{judul}</h3>
            <p className="text-[15px] leading-relaxed text-teks-2">{isi}</p>
          </div>
        ))}
      </div>
    </Seksi>
  )
}

/* ── Leaderboard ──────────────────────────────────────────────────────── */

export function SeksiLeaderboard({ format, children }: { format: Format; children: ReactNode }) {
  return (
    <Seksi id="leaderboard" kicker="Papan peringkat" judul={`Club terbaik ${LABEL_FORMAT[format].toLowerCase()} Pekanbaru`} aksi={<PilihFormat aktif={format} href={(f) => `/?format=${f}#leaderboard`} scroll={false} />}>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_340px] md:items-start">
        {children}
        <CatatanPeringkat format={format} />
      </div>
    </Seksi>
  )
}

/* ── Untuk siapa ──────────────────────────────────────────────────────── */

function Centang({ isi, gelap }: { isi: string[]; gelap?: boolean }) {
  return (
    <ul className="flex flex-col gap-2">
      {isi.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-[15px]">
          <CheckIcon weight="bold" className={cn("mt-0.5 size-4 shrink-0", gelap ? "text-emas" : "text-hijau")} aria-hidden />
          {t}
        </li>
      ))}
    </ul>
  )
}

const KARTU_TERANG = "flex flex-col gap-4 rounded-kartu border-2 border-tinta bg-krem-terang p-6 shadow-keras md:p-8"
const UBIN = "flex size-12 items-center justify-center rounded-tombol border-2 border-tinta bg-emas text-hijau"

export function UntukSiapa() {
  return (
    <Seksi id="untuk-siapa" kicker="Siapa yang cocok" judul="Untuk club yang mau main serius.">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-kartu border-2 border-tinta bg-hijau p-6 text-krem shadow-keras shadow-emas md:p-8">
          <span className={UBIN}>
            <UsersThreeIcon weight="bold" className="size-6" aria-hidden />
          </span>
          <h3 className="text-2xl font-extrabold">Untuk admin club</h3>
          <p className="text-[15px] text-krem-redup">Satu akun untuk satu club. Kamu yang mewakili club di setiap match.</p>
          <Centang gelap isi={["Daftarkan club dan tunggu verifikasi", "Buat match terbuka atau tantang club lain", "Atur jadwal, lapangan, dan catat skor"]} />
          <Button asChild permukaan="gelap" className="mt-2 w-fit">
            <Link href="/daftar?peran=club_admin">
              Daftarkan club <ArrowRightIcon weight="bold" aria-hidden />
            </Link>
          </Button>
        </div>
        {PEMAIN_AKTIF ? (
          <div className={KARTU_TERANG}>
            <span className={UBIN}>
              <TShirtIcon weight="bold" className="size-6" aria-hidden />
            </span>
            <h3 className="text-2xl font-extrabold">Untuk pemain</h3>
            <p className="text-[15px] text-teks-2">Gabung skuad club kamu lewat undangan admin, lalu konfirmasi ikut main.</p>
            <Centang isi={["Lihat jadwal match club kamu", "Jawab ikut atau tidak ikut", "Lihat hasil dan riwayat match club"]} />
            <Button asChild className="mt-2 w-fit">
              <Link href="/daftar?peran=player">
                Gabung skuad <ArrowRightIcon weight="bold" aria-hidden />
              </Link>
            </Button>
          </div>
        ) : (
          <div className={KARTU_TERANG}>
            <span className={UBIN}>
              <MagnifyingGlassIcon weight="bold" className="size-6" aria-hidden />
            </span>
            <h3 className="text-2xl font-extrabold">Lihat dulu, tanpa akun</h3>
            <p className="text-[15px] text-teks-2">Penasaran dengan club di sekitarmu? Semua ini terbuka untuk pengunjung.</p>
            <Centang isi={["Match terbuka yang sedang mencari lawan", "Leaderboard per format", "Profil publik dan statistik club"]} />
            <Button asChild className="mt-2 w-fit">
              <Link href="/jelajahi">
                Lihat match terbuka <ArrowRightIcon weight="bold" aria-hidden />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Seksi>
  )
}

/* ── FAQ ──────────────────────────────────────────────────────────────── */

export function Faq() {
  return (
    <section id="faq" aria-labelledby="h-faq" className="muncul mt-10 grid grid-cols-1 scroll-mt-28 gap-7 md:mt-20 md:grid-cols-[minmax(0,340px)_1fr] md:gap-14">
      <div className="flex flex-col gap-3">
        <JudulSeksi id="h-faq" kicker="Pertanyaan umum" judul="Yang sering ditanyakan" />
        <p className="text-[15px] leading-relaxed text-teks-2">Belum terjawab? Alur lengkapnya ada di bagian Cara kerja.</p>
        <Link href="#cara-kerja" className={TAUTAN_PANAH}>
          Baca cara kerja <ArrowRightIcon weight="bold" aria-hidden />
        </Link>
        <Image src="/brand/pakbola-maskot-terang.svg" alt="" width={180} height={180} className="mt-4 hidden h-[200px] w-auto self-start md:block" />
      </div>
      <Accordion type="single" collapsible defaultValue="0">
        {FAQ.map((f, i) => (
          <AccordionItem key={f.q} value={String(i)}>
            <AccordionTrigger>{f.q}</AccordionTrigger>
            <AccordionContent>{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
