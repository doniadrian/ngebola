import { cn } from "@/lib/utils"
import { terang } from "@/lib/warna"

// Lambang.html "Avatar pemain": kepala gaya Pak Bola, warna kulit/rambut/aksesori acak dari seed,
// jersey = warna club. Tanpa nomor punggung & ban kapten (PLAN.md butir 5). ≤ 40px: detail kecil dihapus.

const KULIT = ["#f0d7bb", "#dcb48f", "#b98a62", "#8a5a3c"]
const LATAR = ["#f6e7bf", "#d5e6dc", "#f2ede0", "#dbe5f2", "#f6dccb", "#efe7d3"]
const RAMBUT = ["#14201a", "#3a2a1e"]
const KAIN = ["#1d7a77", "#a8382a", "#6b5320", "#24507a"]
const TINTA = "#14201a"

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export function ciriAvatar(seed: string) {
  const h = hash(seed)
  const pilih = <T,>(arr: readonly T[], geser: number) => arr[(h >>> geser) % arr.length]
  return {
    kulit: pilih(KULIT, 0),
    latar: pilih(LATAR, 3),
    rambut: pilih(["jabrik", "belah", "topi", "keriting", "bando", "jilbab"] as const, 6),
    warnaRambut: pilih(RAMBUT, 9),
    kain: pilih(KAIN, 11),
    mulut: pilih(["senyum", "datar", "lebar"] as const, 14),
    kacamata: (h >>> 17) % 4 === 0,
  }
}

type Props = {
  seed: string
  nama: string
  /** Warna jersey = warna home club; tanpa club = hijau. */
  jersey?: string
  foto?: string | null
  ukuran?: number
  className?: string
  /** Label kecil di pojok, mis. "ADMIN". */
  label?: string
}

export function AvatarPemain({ seed, nama, jersey = "#123b2c", foto, ukuran = 44, className, label }: Props) {
  const c = ciriAvatar(seed)
  const kecil = ukuran <= 40
  const garis = kecil ? 2.5 : 2.2
  const kerah = terang(jersey) ? TINTA : "#c9a14a"

  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: ukuran, height: ukuran }}>
      <span
        className={cn("block size-full overflow-hidden rounded-full border-tinta", kecil ? "border-2" : "border-[2.5px] shadow-keras-sm shadow-tinta")}
        style={{ backgroundColor: c.latar }}
      >
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto unggahan pengguna, ukuran kecil
          <img src={foto} alt={nama} className="size-full object-cover" />
        ) : (
          <svg viewBox="0 0 64 64" className="size-full" role="img" aria-label={`Avatar ${nama}`}>
            <path d="M6 66 C8 52 18 47 32 47 C46 47 56 52 58 66 Z" fill={jersey} stroke={TINTA} strokeWidth={garis} />
            {c.rambut === "jilbab" ? (
              <>
                <path d="M15.5 31 Q15.5 11 32 11 Q48.5 11 48.5 31 L49 46 Q41 52.5 32 52.5 Q23 52.5 15 46 Z" fill={c.kain} stroke={TINTA} strokeWidth={garis} strokeLinejoin="round" />
                {!kecil && <path d="M21 45.5 Q32 50.5 43 45.5" fill="none" stroke={TINTA} strokeWidth="1.3" opacity=".45" />}
                <ellipse cx="32" cy="30" rx="10.5" ry="12.5" fill={c.kulit} stroke={TINTA} strokeWidth="1.8" />
              </>
            ) : (
              <>
                {!kecil && <path d="M26 47.5 L32 54 L38 47.5" fill="none" stroke={kerah} strokeWidth="2.4" />}
                {!kecil && <path d="M27 38 H37 V49 Q32 52 27 49 Z" fill={c.kulit} stroke={TINTA} strokeWidth="2" />}
                {!kecil && <circle cx="18.5" cy="30" r="3.6" fill={c.kulit} stroke={TINTA} strokeWidth="2" />}
                {!kecil && <circle cx="45.5" cy="30" r="3.6" fill={c.kulit} stroke={TINTA} strokeWidth="2" />}
                <circle cx="32" cy="28" r="13.5" fill={c.kulit} stroke={TINTA} strokeWidth={garis} />
                <Rambut gaya={c.rambut} warna={c.warnaRambut} kain={c.kain} />
              </>
            )}
            <Wajah ciri={c} kecil={kecil} jilbab={c.rambut === "jilbab"} />
          </svg>
        )}
      </span>
      {label && (
        <span className="absolute -right-2.5 bottom-0.5 flex h-[22px] items-center rounded-md border-[1.5px] border-tinta bg-hijau px-1.5 text-[10px] font-extrabold tracking-[.04em] text-krem">
          {label}
        </span>
      )}
    </span>
  )
}

function Rambut({ gaya, warna, kain }: { gaya: string; warna: string; kain: string }) {
  switch (gaya) {
    case "jabrik":
      return <path d="M18.5 26 L20 16 L24.5 19 L27 11.5 L31.5 16.5 L35.5 10.5 L38.5 17 L43 15 L45.5 26 Q41 20 32 20 Q23 20 18.5 26 Z" fill={warna} />
    case "belah":
      return <path d="M18.5 27 Q18 13.5 32 13.5 Q46 13.5 45.5 27 Q44 21 38 19.5 Q30 22 22 20 Q19.5 22 18.5 27 Z" fill={warna} />
    case "topi":
      return (
        <>
          <path d="M17.5 25 Q17.5 12 32 12 Q46.5 12 46.5 25 Z" fill="#c9a14a" stroke={TINTA} strokeWidth="2" strokeLinejoin="round" />
          <path d="M39 22.5 H53 Q55.5 22.5 54.5 25.5 H39 Z" fill="#b08a3a" stroke={TINTA} strokeWidth="2" strokeLinejoin="round" />
        </>
      )
    case "keriting":
      return (
        <g fill={warna}>
          <circle cx="19.5" cy="24" r="4.5" />
          <circle cx="23" cy="17.5" r="5" />
          <circle cx="30" cy="14" r="5.5" />
          <circle cx="37.5" cy="14.5" r="5.5" />
          <circle cx="43" cy="18" r="5" />
          <circle cx="44.8" cy="24.5" r="4.2" />
        </g>
      )
    default: // bando
      return (
        <>
          <path d="M18.5 24 Q18 14 32 14 Q46 14 45.5 24 Q32 18 18.5 24 Z" fill={warna} />
          <path d="M18.6 22.5 Q32 17 45.4 22.5 L45.7 26.5 Q32 21 18.3 26.5 Z" fill={kain} stroke={TINTA} strokeWidth="1.6" strokeLinejoin="round" />
        </>
      )
  }
}

function Wajah({ ciri, kecil, jilbab }: { ciri: ReturnType<typeof ciriAvatar>; kecil: boolean; jilbab: boolean }) {
  const y = jilbab ? 29.5 : 29
  const mataX = jilbab ? [27.5, 36.5] : [27, 37]
  return (
    <>
      {!kecil && !ciri.kacamata && (
        <path
          d={jilbab ? "M25 26 Q27.5 24.8 30 26 M34 26 Q36.5 24.8 39 26" : "M24.5 25.5 Q27 24 29.5 25.5 M34.5 25.5 Q37 24 39.5 25.5"}
          fill="none"
          stroke={TINTA}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
      {ciri.kacamata && !kecil && (
        <>
          <circle cx={mataX[0]} cy={y} r="4" fill="#fbf8f1" fillOpacity=".35" stroke={TINTA} strokeWidth="1.8" />
          <circle cx={mataX[1]} cy={y} r="4" fill="#fbf8f1" fillOpacity=".35" stroke={TINTA} strokeWidth="1.8" />
          <path d={`M${mataX[0] + 4} ${y} H${mataX[1] - 4}`} stroke={TINTA} strokeWidth="1.8" />
        </>
      )}
      <circle cx={mataX[0]} cy={y} r={kecil ? 2 : 1.7} fill={TINTA} />
      <circle cx={mataX[1]} cy={y} r={kecil ? 2 : 1.7} fill={TINTA} />
      {!kecil && (
        <>
          <circle cx={jilbab ? 24.5 : 23.5} cy={jilbab ? 34 : 33.5} r="2.4" fill="#e8a98a" opacity=".55" />
          <circle cx={jilbab ? 39.5 : 40.5} cy={jilbab ? 34 : 33.5} r="2.4" fill="#e8a98a" opacity=".55" />
        </>
      )}
      {ciri.mulut === "datar" ? (
        <path d="M29 35.5 H35" fill="none" stroke={TINTA} strokeWidth={kecil ? 2.2 : 1.8} strokeLinecap="round" />
      ) : ciri.mulut === "lebar" ? (
        <path d="M28 34.5 Q32 39.5 36 34.5 Z" fill={TINTA} />
      ) : (
        <path d="M28.5 35 Q32 38.5 35.5 35" fill="none" stroke={TINTA} strokeWidth={kecil ? 2.2 : 1.8} strokeLinecap="round" />
      )}
    </>
  )
}

/** Tumpukan avatar: tumpang tindih 12px, maksimal 4 + sisa. */
export function AvatarTumpuk({ orang, jersey, ukuran = 40 }: { orang: { seed: string; nama: string; foto?: string | null }[]; jersey?: string; ukuran?: number }) {
  const tampil = orang.slice(0, 4)
  const sisa = orang.length - tampil.length
  return (
    <div className="flex" aria-label={`${orang.length} pemain`}>
      {tampil.map((o, i) => (
        <AvatarPemain key={o.seed} {...o} jersey={jersey} ukuran={ukuran} className={cn(i > 0 && "-ml-3")} />
      ))}
      {sisa > 0 && (
        <span className="-ml-3 flex items-center justify-center rounded-full border-2 border-tinta bg-emas text-[13px] font-extrabold text-tinta" style={{ width: ukuran, height: ukuran }}>
          +{sisa}
        </span>
      )}
    </div>
  )
}
