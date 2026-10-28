"use client"

import { useOptimistic, useTransition } from "react"
import { CheckIcon, QuestionIcon, XIcon } from "@phosphor-icons/react"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { rsvpAction } from "@/server/actions/match"

const PILIHAN = [
  { v: "ikut", label: "Ikut", Ikon: CheckIcon },
  { v: "ragu", label: "Ragu", Ikon: QuestionIcon },
  { v: "tidak", label: "Tidak", Ikon: XIcon },
] as const

/** Konfirmasi ikut (P-03) sebagai segmen (Pola.html): satu bayangan untuk seluruh grup. */
export function SegmenRsvp({ matchId, jawaban, terkunci }: { matchId: string; jawaban: string | null; terkunci: boolean }) {
  const [pending, start] = useTransition()
  const [nilai, setNilai] = useOptimistic(jawaban)
  if (terkunci) {
    return (
      <p className="rounded-tombol border-2 border-nonaktif-tepi px-3.5 py-2.5 text-[13px] text-teks-2">
        Konfirmasi ditutup 2 jam sebelum kick-off{jawaban ? ` · jawabanmu: ${PILIHAN.find((p) => p.v === jawaban)?.label}` : ""}. Hubungi admin club untuk perubahan.
      </p>
    )
  }
  return (
    <div role="radiogroup" aria-label="Ikut main?" className="flex overflow-hidden rounded-tombol border-2 border-hijau shadow-keras">
      {PILIHAN.map(({ v, label, Ikon }, i) => {
        const on = nilai === v
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={pending}
            onClick={() =>
              start(async () => {
                setNilai(v)
                const r = await rsvpAction(matchId, v)
                if (r.ok) toast.berhasil(`Jawabanmu: ${label}`)
                else toast.gagal(r.error ?? "Gagal menyimpan.")
              })
            }
            className={cn(
              "flex h-12 flex-1 items-center justify-center gap-1.5 text-[15px] font-bold transition-[scale,background-color,color] duration-200 ease-pegas tekan:scale-95 tekan:duration-60 tekan:ease-out outline-none focus-visible:z-10 focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-emas",
              i > 0 && "border-l-2 border-hijau",
              on ? "bg-hijau font-extrabold text-krem" : "bg-krem-terang text-hijau hover:bg-white",
            )}
          >
            <Ikon weight={on ? "fill" : "bold"} className="size-5" aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
