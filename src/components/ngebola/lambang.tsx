import { useId } from "react"
import { cn } from "@/lib/utils"
import { inisialDari } from "@/lib/slug"
import { warnaTeksDi } from "@/lib/warna"

// Lambang.html: efek stiker potong (tepi tinta 8, pinggir krem 3, bayangan keras 3px).
// Di bawah 40px pakai versi mini tanpa pinggir krem, bayangan, dan teks panjang.
const PERISAI = "M32 6 L56 13 V34 C56 50 45 60 32 66 C19 60 8 50 8 34 V13 Z"
const KOTAK = "M15 8 H49 Q56 8 56 15 V59 Q56 66 49 66 H15 Q8 66 8 59 V15 Q8 8 15 8 Z"

type LambangProps = {
  nama: string
  /** Logo unggahan; tanpa logo dipakai lambang otomatis (inisial + warna club). */
  logo?: string | null
  warna?: string
  inisial?: string
  /** Lebar dalam px; tinggi mengikuti rasio 64:74. */
  ukuran?: number
  className?: string
  /** Hiasan saja (nama club sudah tertulis di sebelahnya). */
  hiasan?: boolean
}

export function Lambang({ nama, logo, warna = "#123b2c", inisial, ukuran = 56, className, hiasan = false }: LambangProps) {
  const clip = useId()
  const mini = ukuran < 40
  const teks = (inisial ?? inisialDari(nama)).slice(0, mini ? 1 : 3)
  const a11y = hiasan ? { "aria-hidden": true } : { role: "img", "aria-label": `Lambang ${nama}` }

  return (
    <svg viewBox="0 0 64 74" width={ukuran} height={Math.round((ukuran * 74) / 64)} className={cn("shrink-0 overflow-visible", className)} {...a11y}>
      {logo ? (
        <>
          <clipPath id={clip}>
            <rect x="13" y="13" width="38" height="48" rx="4" />
          </clipPath>
          {!mini && <path transform="translate(0 3)" d={KOTAK} className="fill-tinta stroke-tinta" strokeWidth="8" strokeLinejoin="round" />}
          <path d={KOTAK} className="fill-white stroke-tinta" strokeWidth={mini ? 5 : 8} strokeLinejoin="round" />
          {!mini && <path d={KOTAK} className="fill-none stroke-krem-terang" strokeWidth="3" strokeLinejoin="round" />}
          <image href={logo} x="13" y="13" width="38" height="48" preserveAspectRatio="xMidYMid meet" clipPath={`url(#${clip})`} />
        </>
      ) : (
        <>
          <clipPath id={clip}>
            <path d={PERISAI} />
          </clipPath>
          {!mini && <path transform="translate(0 3)" d={PERISAI} className="fill-tinta stroke-tinta" strokeWidth="8" strokeLinejoin="round" />}
          <path d={PERISAI} fill={warna} className="stroke-tinta" strokeWidth={mini ? 5 : 8} strokeLinejoin="round" />
          {!mini && (
            <g clipPath={`url(#${clip})`}>
              <path d="M0 44 L32 55 L64 44 V51 L32 62 L0 51 Z" className="fill-emas" />
            </g>
          )}
          {!mini && <path d={PERISAI} className="fill-none stroke-krem-terang" strokeWidth="3" strokeLinejoin="round" />}
          <text
            x="32"
            y={mini ? 43 : 38}
            textAnchor="middle"
            fontSize={mini ? 26 : teks.length > 2 ? 14 : 17}
            fontWeight="800"
            letterSpacing="-.5"
            fill={warnaTeksDi(warna)}
            className="font-sans"
          >
            {teks}
          </text>
        </>
      )}
    </svg>
  )
}
