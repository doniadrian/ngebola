import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { CalendarCheckIcon, ShieldCheckIcon, SoccerBallIcon } from "@phosphor-icons/react/ssr"

const FITUR = [
  { Ikon: SoccerBallIcon, teks: "Cari club lawan se-Pekanbaru" },
  { Ikon: CalendarCheckIcon, teks: "Atur jadwal & lapangan" },
  { Ikon: ShieldCheckIcon, teks: "Skor & reputasi club tercatat" },
]

const GARIS_LAPANGAN ="bg-hijau bg-[repeating-linear-gradient(90deg,var(--color-hijau)_0_48px,var(--color-hijau-garis)_48px_96px)]"

// Login-HP.html (panel hijau di atas, papan krem bersudut 28) & Login-Desktop.html (panel hijau 560px di kiri).
// Teks iuran di referensi diganti: iuran di luar cakupan (CLAUDE.md).
export function KerangkaTamu({ judul, sub, children, ringkas = false }: { judul: string; sub?: ReactNode; children: ReactNode; ringkas?: boolean }) {
  return (
    <div className="min-h-dvh lg:flex">
      <aside className="relative hidden w-[560px] shrink-0 flex-col gap-7 overflow-hidden border-r-2 border-tinta bg-[repeating-linear-gradient(90deg,var(--color-hijau)_0_100px,var(--color-hijau-garis)_100px_200px)] px-14 py-12 text-krem lg:flex">
        <div aria-hidden className="absolute top-[470px] left-[330px] size-[420px] rounded-full border-2 border-krem/18" />
        <div aria-hidden className="absolute inset-y-0 left-[538px] w-0.5 bg-krem/18" />
        <Link href="/" className="relative self-start rounded-kecil outline-none focus-visible:outline-3 focus-visible:outline-emas">
          <Image src="/brand/ngebola-lockup-gelap.svg" alt="Ngebola" width={150} height={40} className="h-10 w-auto" priority />
        </Link>
        <p className="relative mt-6 max-w-[440px] text-[40px] leading-[1.05] font-extrabold tracking-tight">
          Cari lawan sparring di Pekanbaru.
          <span className="mt-1 block text-emas">Hasil tercatat, reputasi terbukti.</span>
        </p>
        <ul className="relative flex max-w-[300px] flex-col gap-3.5 text-base leading-snug">
          {FITUR.map(({ Ikon, teks }) => (
            <li key={teks} className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-kecil border-2 border-tinta bg-emas text-tinta">
                <Ikon weight="bold" className="size-5" aria-hidden />
              </span>
              {teks}
            </li>
          ))}
        </ul>
        <Image src="/brand/pakbola-maskot-gelap.png" alt="" width={380} height={380} className="absolute right-[18px] -bottom-3.5 h-[380px] w-auto" />
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col lg:items-center lg:justify-center">
        <div className={`relative w-full overflow-hidden lg:hidden ${ringkas ? "h-[92px]" : "h-[300px]"} ${GARIS_LAPANGAN}`}>
          <div aria-hidden className={`absolute top-[230px] left-1/2 size-[300px] -translate-x-1/2 rounded-full border-2 border-krem/18 ${ringkas ? "hidden" : ""}`} />
          <Link href="/" className={`absolute ${ringkas ? "top-1/2 -translate-y-1/2" : "top-[max(20px,env(safe-area-inset-top))]"} left-6 rounded-kecil outline-none focus-visible:outline-3 focus-visible:outline-emas`}>
            <Image src="/brand/ngebola-lockup-gelap.svg" alt="Ngebola" width={128} height={34} className="h-[34px] w-auto" priority />
          </Link>
          <Image
            src="/brand/pakbola-maskot-gelap.png"
            alt=""
            width={220}
            height={220}
            className={`absolute ${ringkas ? "right-5 bottom-0 h-[82px]" : "top-[76px] left-1/2 h-[220px] -translate-x-1/2"} w-auto`}
            priority
          />
        </div>
        <main
          id="konten"
          className="relative -mt-[22px] flex w-full flex-1 flex-col gap-3.5 rounded-t-[28px] border-t-2 border-tinta bg-krem px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-md sm:border-x-2 lg:mt-0 lg:max-w-[400px] lg:flex-none lg:gap-5 lg:rounded-none lg:border-0 lg:px-0 lg:py-12"
        >
          <div>
            <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] text-hijau lg:text-[34px]">{judul}</h1>
            {sub && <p className="mt-1.5 text-[15px] leading-normal text-teks-2 lg:mt-2 lg:text-base">{sub}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
