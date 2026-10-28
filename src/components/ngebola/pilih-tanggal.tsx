"use client"

import { useState } from "react"
import { CalendarBlankIcon, CaretDownIcon } from "@phosphor-icons/react"
import type { Matcher } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { kolomIsian } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatTanggalPanjang, tanggalWIB } from "@/lib/waktu"
import { cn } from "@/lib/utils"

// Tanggal disimpan sebagai YYYY-MM-DD (kalender WIB). Date lokal dibuat dari komponen tanggal agar tidak bergeser zona.
const keDate = (v: string) => {
  const [y, m, d] = v.split("-").map(Number)
  return new Date(y, m - 1, d, 12)
}
const keNilai = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

/** Calendar + Popover berbahasa Indonesia (PRD 1). Nilai dikirim lewat input tersembunyi bernama `name`. */
export function PilihTanggal({
  id,
  name,
  defaultValue,
  placeholder = "Pilih tanggal",
  dropdownTahun,
  dariTahun,
  sampaiTahun,
  disabled,
  invalid,
  describedBy,
  onChange,
  kompak,
}: {
  id: string
  name: string
  defaultValue?: string
  placeholder?: string
  /** Bulan & tahun bisa dipilih dari dropdown (mis. tanggal lahir). */
  dropdownTahun?: boolean
  dariTahun?: number
  sampaiTahun?: number
  disabled?: Matcher | Matcher[]
  invalid?: boolean
  describedBy?: string
  onChange?: (nilai: string) => void
  /** Tinggi 48 (form padat) alih-alih 52. */
  kompak?: boolean
}) {
  const [nilai, setNilai] = useState(defaultValue ?? "")
  const [buka, setBuka] = useState(false)
  const terpilih = nilai ? keDate(nilai) : undefined
  const tahunIni = Number(tanggalWIB(new Date()).slice(0, 4))

  return (
    <Popover open={buka} onOpenChange={setBuka}>
      <input type="hidden" name={name} value={nilai} />
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          // aria-invalid tidak berlaku untuk tombol; pesan error dihubungkan lewat aria-describedby.
          data-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            kolomIsian,
            kompak ? "h-12" : "h-[52px]",
            "flex items-center gap-2.5 px-3.5 text-left font-bold data-[invalid=true]:border-merah data-[invalid=true]:bg-bg-error data-[state=open]:bg-white data-[state=open]:ring-4 data-[state=open]:ring-emas/60"
          )}
        >
          <CalendarBlankIcon weight="bold" className="size-5 shrink-0 text-hijau" aria-hidden />
          <span className={cn("flex-1", !terpilih && "font-normal text-placeholder")}>
            {terpilih ? formatTanggalPanjang(new Date(Date.UTC(terpilih.getFullYear(), terpilih.getMonth(), terpilih.getDate(), 5))) : placeholder}
          </span>
          <CaretDownIcon weight="bold" className="size-5 shrink-0 text-hijau" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={terpilih}
          defaultMonth={terpilih ?? (dropdownTahun && sampaiTahun ? new Date(sampaiTahun, 0, 1) : undefined)}
          captionLayout={dropdownTahun ? "dropdown" : "label"}
          startMonth={new Date(dariTahun ?? tahunIni - 1, 0)}
          endMonth={new Date(sampaiTahun ?? tahunIni + 1, 11)}
          disabled={disabled}
          onSelect={(d) => {
            if (!d) return
            const v = keNilai(d)
            setNilai(v)
            onChange?.(v)
            setBuka(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
