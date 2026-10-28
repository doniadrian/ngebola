"use client"

import { RadioGroup as RG } from "radix-ui"
import { CheckIcon } from "@phosphor-icons/react"
import { WARNA_CLUB, terang } from "@/lib/warna"
import { cn } from "@/lib/utils"

/** Pilihan warna club dari palet (bulatan 44px, tepi tinta). Nama warna dibacakan, bukan hanya warnanya. */
export function PilihWarna({ name, defaultValue, label, invalid }: { name: string; defaultValue?: string; label: string; invalid?: boolean }) {
  return (
    <RG.Root name={name} defaultValue={defaultValue ?? WARNA_CLUB[0].hex} aria-label={label} aria-invalid={invalid || undefined} className="flex flex-wrap gap-2.5">
      {WARNA_CLUB.map((w) => (
        <RG.Item
          key={w.hex}
          value={w.hex}
          aria-label={w.nama}
          title={w.nama}
          className="group relative flex size-11 items-center justify-center rounded-full border-2 border-tinta transition-[scale,box-shadow] duration-200 ease-pegas tekan:scale-90 tekan:duration-60 tekan:ease-out outline-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-hijau data-[state=checked]:shadow-keras-sm data-[state=checked]:shadow-tinta"
          style={{ backgroundColor: w.hex }}
        >
          <RG.Indicator>
            <CheckIcon weight="bold" className={cn("size-5", terang(w.hex) ? "text-tinta" : "text-krem")} />
          </RG.Indicator>
        </RG.Item>
      ))}
    </RG.Root>
  )
}
