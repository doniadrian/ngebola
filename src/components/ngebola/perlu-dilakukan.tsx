import type { ReactNode } from "react"
import Link from "next/link"
import { CaretRightIcon, CheckCircleIcon } from "@phosphor-icons/react/ssr"
import { Hitungan } from "@/components/ui/badge"
import { LabelSeksi } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type Tugas = { key: string; judul: string; sub?: string; href: string; mendesak?: boolean; jumlah?: number }

/** "Perlu Anda lakukan" (PRD 1): hanya tindakan milik peran ini; panel kosong tidak mendahului jadwal. */
export function PerluDilakukan({ tugas, judul = "Perlu Anda lakukan" }: { tugas: Tugas[]; judul?: string }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="perlu-dilakukan">
      <LabelSeksi id="perlu-dilakukan">{judul}</LabelSeksi>
      {tugas.length === 0 ? (
        <p className="flex items-center gap-2 rounded-besar border-2 border-dashed border-nonaktif-tepi px-4 py-3 text-sm text-teks-2">
          <CheckCircleIcon weight="bold" className="size-5 text-hijau" aria-hidden />
          Semua beres untuk sekarang.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {tugas.map((t) => (
            <li key={t.key}>
              <Link
                href={t.href}
                className={cn(
                  "flex items-center gap-3 rounded-besar border-2 px-4 py-3 shadow-keras-sm transition-[translate,box-shadow] duration-[240ms] ease-pegas tekan:duration-60 tekan:ease-out outline-none tekan:translate-y-[3px] tekan:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-hijau",
                  t.mendesak ? "border-tinta bg-bg-menunggu shadow-tinta" : "border-hijau bg-krem-terang",
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-extrabold">{t.judul}</span>
                  {t.sub && <span className="text-[13px] text-teks-2">{t.sub}</span>}
                </span>
                {t.jumlah ? <Hitungan jumlah={t.jumlah} /> : null}
                <CaretRightIcon weight="bold" className="size-5 shrink-0 text-hijau" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Tata letak dashboard: tindakan di samping konten (desktop), tindakan dulu (HP). */
export function TataDashboard({ tindakan, children }: { tindakan: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
      <div className="md:col-start-2 md:row-start-1">{tindakan}</div>
      <div className="flex min-w-0 flex-col gap-6 md:col-start-1 md:row-start-1">{children}</div>
    </div>
  )
}
