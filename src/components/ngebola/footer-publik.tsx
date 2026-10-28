import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon, ArrowUpIcon } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"
import { PEMAIN_AKTIF } from "@/lib/fitur"

const KOLOM = [
  { judul: "Jelajahi", tautan: [["/jelajahi", "Match terbuka"], ["/leaderboard", "Leaderboard"], ["/#cara-kerja", "Cara kerja"], ["/#faq", "FAQ"]] },
  { judul: "Mulai", tautan: [["/daftar?peran=club_admin", "Daftarkan club"], ...(PEMAIN_AKTIF ? [["/daftar?peran=player", "Daftar sebagai pemain"]] : []), ["/masuk", "Masuk"]] },
  { judul: "Cari lawan di", tautan: ["Tenayan Raya", "Marpoyan Damai", "Sukajadi", "Bukit Raya", "Sail", "Rumbai"].map((a) => [`/jelajahi?area=${encodeURIComponent(a)}`, a]) },
] as const

const TAUT = "inline-flex min-h-11 items-center text-[15px] font-semibold text-tinta underline-offset-4 outline-none hover:text-hijau hover:underline hover:decoration-2 focus-visible:outline-3 focus-visible:outline-hijau md:min-h-9"

// Footer = kartu stiker di atas hamparan lapangan. Hanya tautan nyata: tanpa media sosial/WhatsApp palsu;
// email kontak tampil bila KONTAK_EMAIL diisi.
export function FooterPublik({ masuk, rumah }: { masuk: boolean; rumah: string }) {
  const email = process.env.KONTAK_EMAIL
  return (
    <footer className="relative mt-12 overflow-hidden border-t-2 border-tinta bg-[repeating-linear-gradient(90deg,var(--color-hijau)_0_48px,var(--color-hijau-garis)_48px_96px)] px-4 pt-10 pb-6 md:px-6 md:pt-16">
      {/* Marka lapangan: garis tengah + lingkaran tengah, hanya hiasan */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 bg-krem/10" />
        <div className="absolute top-24 left-1/2 size-[360px] -translate-x-1/2 rounded-full border-2 border-krem/10 md:size-[520px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-8 rounded-kartu border-2 border-tinta bg-krem-terang p-5 text-tinta shadow-keras-xl shadow-emas md:p-8">
          <div className="relative flex flex-col gap-5 overflow-hidden rounded-besar border-2 border-tinta bg-hijau-tua p-5 text-krem lg:flex-row lg:items-center lg:justify-between md:p-8 lg:pr-44">
            <Image src="/brand/pakbola-maskot-gelap.png" alt="" width={150} height={150} className="pointer-events-none absolute right-4 -bottom-6 hidden h-[150px] w-auto lg:block" />
            <div className="flex flex-col gap-1.5 lg:max-w-sm">
              <p className="text-[13px] font-extrabold tracking-[.1em] text-emas uppercase">Kick-off</p>
              <p className="text-2xl leading-tight font-extrabold tracking-tight text-balance md:text-3xl">Sparring berikutnya dimulai dari sini.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button asChild permukaan="gelap" size="b">
                <Link href={masuk ? rumah : "/daftar?peran=club_admin"}>
                  {masuk ? "Buka Aplikasi" : "Daftarkan Club"}
                  <ArrowRightIcon weight="bold" aria-hidden />
                </Link>
              </Button>
              <Button asChild permukaan="gelap" variant="garis" size="b">
                <Link href="/jelajahi">Lihat Match Terbuka</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-10">
            <div className="col-span-2 flex flex-col items-start gap-3 md:col-span-1">
              <Image src="/brand/ngebola-lockup-terang.svg" alt="Ngebola" width={160} height={43} className="h-[43px] w-auto" />
              <p className="max-w-xs text-[15px] leading-normal text-teks-2">
                Platform sparring antar club fun football di Pekanbaru. Cari lawan setara, catat hasil, bangun reputasi.
              </p>
              {email && <a href={`mailto:${email}`} className={TAUT}>{email}</a>}
            </div>
            {KOLOM.map((k) => (
              <nav key={k.judul} aria-label={k.judul} className={k.judul === "Cari lawan di" ? "col-span-2 grid grid-cols-2 md:col-span-1 md:flex md:flex-col" : "flex flex-col"}>
                <p className="col-span-2 mb-1 text-[13px] font-extrabold tracking-[.1em] text-emas-tua uppercase">{k.judul}</p>
                {k.tautan.map(([href, label]) => (
                  <Link key={href} href={href} className={TAUT}>{label}</Link>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[13px] text-krem-redup">
          <p>© 2026 Ngebola · Dibuat di Pekanbaru · Waktu dalam WIB</p>
          <nav aria-label="Legal" className="flex gap-x-5">
            <Link href="/syarat-layanan" className="inline-flex min-h-11 items-center font-semibold underline-offset-4 outline-none hover:text-krem hover:underline focus-visible:outline-3 focus-visible:outline-emas">Syarat layanan</Link>
            <Link href="/kebijakan-privasi" className="inline-flex min-h-11 items-center font-semibold underline-offset-4 outline-none hover:text-krem hover:underline focus-visible:outline-3 focus-visible:outline-emas">Kebijakan privasi</Link>
          </nav>
          <Button asChild permukaan="gelap" variant="garis" size="k" className="w-full sm:w-auto">
            <a href="#konten">Kembali ke atas<ArrowUpIcon weight="bold" aria-hidden /></a>
          </Button>
        </div>
      </div>
    </footer>
  )
}
