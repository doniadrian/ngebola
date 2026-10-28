"use client"

import { useState } from "react"
import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Format } from "@/db/enums"
import { PILIHAN_JAM } from "@/lib/form-match"
import { formatRupiah } from "@/lib/waktu"
import { cn } from "@/lib/utils"
import { Field, idPesan } from "./field"
import { PilihTanggal } from "./pilih-tanggal"

export type VenueOpsi = { id: string; name: string; area: string; forMini: boolean; forFootball: boolean; pricePerHour: number | null; verified: boolean }
type Awal = { opsi?: { tanggal: string; jam: string }[]; venueId?: string | null; manualName?: string | null; manualAddress?: string | null; feeTotal?: number | null; pesan?: string | null }

const ribuan = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 9)
  return d ? Number(d).toLocaleString("id-ID") : ""
}

/** Opsi jadwal + lapangan + biaya + pesan. Nama field cocok dengan `bacaUsulan` di server. */
export function EditorUsulan({
  venues,
  format,
  awal = {},
  errors = {},
  maksOpsi = 3,
  minHari = 1,
  tampilBiaya = true,
  tampilLapangan = true,
  labelPesan,
}: {
  venues: VenueOpsi[]
  format: Format
  awal?: Awal
  errors?: Record<string, string>
  maksOpsi?: number
  /** Tanggal paling awal yang bisa dipilih (hari dari sekarang). */
  minHari?: number
  tampilBiaya?: boolean
  tampilLapangan?: boolean
  labelPesan?: string
}) {
  const [baris, setBaris] = useState(() => Math.max(1, Math.min(maksOpsi, awal.opsi?.length ?? 1)))
  const [venue, setVenue] = useState(awal.venueId ?? (awal.manualName ? "manual" : ""))
  const [biaya, setBiaya] = useState(awal.feeTotal ? awal.feeTotal.toLocaleString("id-ID") : "")
  const cocok = venues.filter((v) => (format === "football" ? v.forFootball : v.forMini))
  const venueSah = venue === "manual" || cocok.some((v) => v.id === venue) ? venue : ""
  const dipilih = cocok.find((v) => v.id === venueSah)
  const minTanggal = new Date()
  minTanggal.setDate(minTanggal.getDate() + minHari)
  minTanggal.setHours(0, 0, 0, 0)

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-3" aria-describedby={errors.opsi ? idPesan("opsi") : undefined}>
        <legend className="mb-1 text-sm font-bold">{maksOpsi > 1 ? `Opsi jadwal (1–${maksOpsi}, WIB)` : "Jadwal (WIB)"}</legend>
        {Array.from({ length: baris }, (_, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {maksOpsi > 1 && <span className="text-xs font-bold text-teks-2">Opsi {i + 1}</span>}
              <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
                <PilihTanggal id={`tanggal_${i}`} name={`tanggal_${i}`} defaultValue={awal.opsi?.[i]?.tanggal} placeholder="Tanggal" disabled={{ before: minTanggal }} invalid={!!errors.opsi} />
                <Select name={`jam_${i}`} defaultValue={awal.opsi?.[i]?.jam ?? "19:00"}>
                  <SelectTrigger aria-label={`Jam opsi ${i + 1}`} className="px-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {PILIHAN_JAM.map((j) => (
                      <SelectItem key={j} value={j}>
                        {j.replace(":", ".")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {i === baris - 1 && i > 0 && (
              <Button type="button" variant="teks" size="ikon" className="text-merah" aria-label={`Hapus opsi ${i + 1}`} onClick={() => setBaris((b) => b - 1)}>
                <TrashIcon />
              </Button>
            )}
          </div>
        ))}
        {baris < maksOpsi && (
          <Button type="button" variant="teks" size="k" className="self-start px-1" onClick={() => setBaris((b) => b + 1)}>
            <PlusIcon aria-hidden />
            Tambah opsi jadwal
          </Button>
        )}
        {errors.opsi && (
          <p id={idPesan("opsi")} role="alert" className="text-[13px] font-bold text-merah">
            {errors.opsi}
          </p>
        )}
      </fieldset>

      {tampilLapangan && (
        <Field id="venueId" label="Lapangan" error={errors.venueId} hint={dipilih?.pricePerHour ? `${dipilih.area} · ${formatRupiah(dipilih.pricePerHour)}/jam${dipilih.verified ? "" : " · belum terverifikasi"}` : venueSah === "manual" ? "Lapangan manual ditandai belum terverifikasi." : undefined}>
          <Select name="venueId" value={venueSah} onValueChange={setVenue}>
            <SelectTrigger id="venueId" aria-invalid={errors.venueId ? true : undefined}>
              <SelectValue placeholder="Pilih lapangan" />
            </SelectTrigger>
            <SelectContent>
              {cocok.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} · {v.area}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="manual">+ Lapangan belum terdaftar (isi manual)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}
      {tampilLapangan && venueSah === "manual" && (
        <div className={cn("grid gap-4 rounded-besar border-2 border-dashed border-nonaktif-tepi p-4 md:grid-cols-2")}>
          <Field id="manualName" label="Nama lapangan">
            <Input id="manualName" name="manualName" defaultValue={awal.manualName ?? ""} maxLength={100} required />
          </Field>
          <Field id="manualAddress" label="Alamat" hint="Hanya terlihat oleh club lawan.">
            <Input id="manualAddress" name="manualAddress" defaultValue={awal.manualAddress ?? ""} maxLength={200} required />
          </Field>
        </div>
      )}

      {tampilBiaya && (
        <Field id="feeTotal" label="Total biaya lapangan" opsional error={errors.feeTotal} hint="Total sewa, bukan per orang. Pembagiannya disepakati lewat chat.">
          <div className="flex h-[52px] overflow-hidden rounded-tombol border-2 border-hijau bg-krem-terang has-[:focus-visible]:bg-white has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emas/60">
            <span className="flex items-center border-r-2 border-hijau bg-emas px-3.5 text-base font-extrabold" aria-hidden>
              Rp
            </span>
            <input
              id="feeTotal"
              name="feeTotal"
              inputMode="numeric"
              value={biaya}
              onChange={(e) => setBiaya(ribuan(e.target.value))}
              placeholder="450.000"
              aria-invalid={errors.feeTotal ? true : undefined}
              className="min-w-0 flex-1 bg-transparent px-3 text-xl font-extrabold text-hijau outline-none placeholder:text-base placeholder:font-normal placeholder:text-placeholder"
            />
          </div>
        </Field>
      )}

      {labelPesan && (
        <Field id="pesan" label={labelPesan} opsional>
          <Textarea id="pesan" name="pesan" defaultValue={awal.pesan ?? ""} maxLength={300} className="min-h-16" rows={2} placeholder="mis. Bawa rompi 2 warna ya, kami sedia bola & air minum." />
        </Field>
      )}
    </div>
  )
}
