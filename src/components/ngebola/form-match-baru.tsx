"use client"

import { useActionState, useState } from "react"
import { CaretDownIcon } from "@phosphor-icons/react"
import { RadioCard, RadioGroup } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AREA, FORMAT, LABEL_FORMAT, LABEL_LEVEL, LEVEL, MIN_PEMAIN, type Format } from "@/db/enums"
import type { FormState } from "@/lib/form-state"
import { buatMatchAction } from "@/server/actions/match"
import { EditorUsulan, type VenueOpsi } from "./editor-usulan"
import { Field } from "./field"
import { TombolKirim } from "./tombol-kirim"
import { Banner } from "./umpan-balik"

/** Form match terbuka / tantangan (PRD 1: cukup lawan, format, satu jadwal, lapangan, biaya; sisanya opsional). */
export function FormMatchBaru({
  jenis,
  lawanClubId,
  venues,
  areaClub,
  levelClub,
  awal,
}: {
  jenis: "terbuka" | "tantangan"
  lawanClubId?: string
  venues: VenueOpsi[]
  areaClub: string
  levelClub: string
  awal?: { format?: Format; venueId?: string | null; manualName?: string | null; manualAddress?: string | null; feeTotal?: number | null; rematchOf?: string }
}) {
  const [state, action] = useActionState(buatMatchAction.bind(null, jenis, lawanClubId ?? null), {} as FormState)
  const v = state.values ?? {}
  const [format, setFormat] = useState<Format>((v.format as Format) || awal?.format || "mini")
  const e = state.fieldErrors ?? {}

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      {awal?.rematchOf && <input type="hidden" name="rematchOf" value={awal.rematchOf} />}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-bold">Format</legend>
        <RadioGroup name="format" value={format} onValueChange={(f) => setFormat(f as Format)} className="grid-cols-2 gap-2">
          {FORMAT.map((f) => (
            <RadioCard key={f} value={f} judul={LABEL_FORMAT[f]} keterangan={`Min. ${MIN_PEMAIN[f]} pemain`} className="px-3 py-2.5" />
          ))}
        </RadioGroup>
      </fieldset>

      <EditorUsulan
        venues={venues}
        format={format}
        errors={e}
        awal={{ venueId: awal?.venueId, manualName: awal?.manualName, manualAddress: awal?.manualAddress, feeTotal: awal?.feeTotal }}
        labelPesan={jenis === "tantangan" ? "Pesan untuk lawan" : "Catatan"}
      />

      <details className="group rounded-besar border-2 border-nonaktif-tepi bg-krem-terang">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold outline-none focus-visible:outline-3 focus-visible:outline-hijau">
          Pengaturan opsional: area & level
          <CaretDownIcon className="size-5 text-hijau transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="grid gap-4 px-4 pb-4 md:grid-cols-2">
          <Field id="area" label="Area match" hint={`Bawaan: ${areaClub} (area club).`}>
            <Select name="area" defaultValue={v.area || areaClub}>
              <SelectTrigger id="area">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREA.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="level" label="Level lawan yang dicari" hint={`Bawaan: ${LABEL_LEVEL[levelClub as keyof typeof LABEL_LEVEL]} (level club).`}>
            <Select name="level" defaultValue={v.level || levelClub}>
              <SelectTrigger id="level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVEL.map((l) => (
                  <SelectItem key={l} value={l}>{LABEL_LEVEL[l]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </details>

      <TombolKirim size="b" className="w-full md:w-auto md:self-end">
        {jenis === "terbuka" ? "Terbitkan Match Terbuka" : "Kirim Tantangan"}
      </TombolKirim>
    </form>
  )
}
