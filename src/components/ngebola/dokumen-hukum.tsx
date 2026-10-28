import type { ReactNode } from "react"
import Link from "next/link"
import { TANGGAL_BERLAKU, VERSI_DOKUMEN } from "@/lib/hukum"
import { HeroHalaman } from "./seksi"

export type Bagian = { judul: string; isi: ReactNode }

/** Hero dokumen hukum (judul + tanggal berlaku), dipasang lewat prop `hero` KerangkaPublik. */
export function HeroDokumen({ judul }: { judul: string }) {
  return (
    <HeroHalaman kicker="Dokumen hukum" judul={judul}>
      Berlaku sejak {TANGGAL_BERLAKU} · versi {VERSI_DOKUMEN}
    </HeroHalaman>
  )
}

/** Isi dokumen hukum: ringkasan, daftar isi (lengket di samping pada desktop), bagian bernomor. Bahasa sederhana, bukan kutipan pasal. */
export function DokumenHukum({ ringkas, bagian, lainnya }: { ringkas: string; bagian: Bagian[]; lainnya: { href: string; label: string } }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr] lg:gap-12">
      <nav aria-label="Isi dokumen" className="h-fit rounded-kartu border-2 border-tinta bg-krem-terang p-5 lg:sticky lg:top-28">
        <p className="mb-2 text-[13px] font-extrabold tracking-[.12em] text-emas-tua uppercase">Isi dokumen</p>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm marker:font-bold marker:text-emas-tua">
          {bagian.map((b, i) => (
            <li key={b.judul}>
              <a href={`#bagian-${i + 1}`} className="inline-flex min-h-8 items-center font-semibold text-hijau underline-offset-4 hover:underline">
                {b.judul}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <article className="flex max-w-3xl min-w-0 flex-col gap-7">
        <p className="rounded-kartu border-2 border-tinta bg-hijau px-5 py-4 text-base leading-relaxed text-krem shadow-keras shadow-emas">{ringkas}</p>
        {bagian.map((b, i) => (
          <section key={b.judul} id={`bagian-${i + 1}`} className="flex scroll-mt-28 flex-col gap-2.5">
            <h2 className="flex items-baseline gap-3 text-xl font-extrabold text-hijau md:text-2xl">
              <span className="text-emas-tua tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              {b.judul}
            </h2>
            <div className="flex flex-col gap-2 text-base leading-relaxed text-teks-2 [&_b]:text-tinta [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">{b.isi}</div>
          </section>
        ))}
        <p className="border-t-2 border-dashed border-nonaktif-tepi pt-4 text-sm text-teks-2">
          Lihat juga{" "}
          <Link href={lainnya.href} className="font-bold text-hijau underline underline-offset-4">
            {lainnya.label}
          </Link>
          .
        </p>
      </article>
    </div>
  )
}

/** Kontak untuk permintaan data; diatur lewat KONTAK_EMAIL di production. */
export function Kontak() {
  const email = process.env.KONTAK_EMAIL
  return email ? (
    <a href={`mailto:${email}`} className="font-bold text-hijau underline underline-offset-4">
      {email}
    </a>
  ) : (
    <b>Admin platform Ngebola (alamat kontak resmi diumumkan di aplikasi)</b>
  )
}
