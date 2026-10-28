"use client"

import { useActionState } from "react"
import { CaretDownIcon } from "@phosphor-icons/react"
import { Field, idPesan, propsKolom } from "@/components/ngebola/field"
import { PilihWarna } from "@/components/ngebola/pilih-warna"
import { TombolKirim } from "@/components/ngebola/tombol-kirim"
import { UnggahGambar } from "@/components/ngebola/unggah-gambar"
import { Banner } from "@/components/ngebola/umpan-balik"
import { Input } from "@/components/ui/input"
import { RadioCard, RadioGroup } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AREA, LABEL_LEVEL, LEVEL } from "@/db/enums"
import type { FormState } from "@/lib/form-state"
import { simpanClubAction } from "@/server/actions/club"

type Awal = {
  name?: string
  area?: string
  level?: string
  foundedYear?: number | null
  description?: string | null
  contactPhone?: string | null
  crestColor?: string
  jerseyHome?: string
  jerseyAway?: string
  logoPath?: string | null
}

const K = "gap-1.5"

/**
 * Form registrasi / profil club (PRD A-04, C-01). Kota tetap Pekanbaru.
 * Hanya isian wajib yang tampil; logo, warna, tahun, dan deskripsi dilipat di "Tampilan & detail" (progressive disclosure).
 */
export function FormClub({ awal = {}, tombol }: { awal?: Awal; tombol: string }) {
  const [state, action] = useActionState(simpanClubAction, {} as FormState)
  const e = state.fieldErrors ?? {}
  const v = { ...Object.fromEntries(Object.entries(awal).map(([k, x]) => [k, x == null ? "" : String(x)])), ...state.values }
  // Buka otomatis bila ada galat di bagian lipatan atau club sudah punya logo/deskripsi.
  const bukaDetail = !!(e.logo || e.foundedYear || e.description || e.crestColor || e.jerseyHome || e.jerseyAway)

  return (
    <form action={action} noValidate className="flex flex-col gap-3.5">
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      {state.ok && <Banner jenis="saran">{state.message}</Banner>}

      <Field id="name" label="Nama club" error={e.name} className={K}>
        <Input {...propsKolom("name", e.name)} className="h-12" defaultValue={v.name} placeholder="mis. Garuda FC" maxLength={60} required />
      </Field>
      <Field id="area" label="Area basis (Pekanbaru)" error={e.area} className={K}>
        <Select name="area" defaultValue={v.area || undefined}>
          <SelectTrigger id="area" className="h-12" aria-invalid={e.area ? true : undefined} aria-describedby={e.area ? idPesan("area") : undefined}>
            <SelectValue placeholder="Pilih kecamatan" />
          </SelectTrigger>
          <SelectContent>
            {AREA.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-bold">Level club</legend>
        <RadioGroup name="level" defaultValue={v.level || undefined} className="grid-cols-3 gap-2">
          {LEVEL.map((l) => (
            <RadioCard key={l} value={l} judul={LABEL_LEVEL[l]} className="flex-col items-start gap-1.5 px-3 py-2.5" aria-invalid={e.level ? true : undefined} />
          ))}
        </RadioGroup>
        <p className="text-xs text-teks-2">Dikoreksi otomatis dari rating setelah 5 hasil.</p>
        {e.level && <p className="text-[13px] font-bold text-merah">{e.level}</p>}
      </fieldset>

      <Field id="contactPhone" label="Nomor HP pengurus" hint="Hanya dilihat Admin platform untuk verifikasi." error={e.contactPhone} className={K}>
        <Input {...propsKolom("contactPhone", e.contactPhone, true)} className="h-12" defaultValue={v.contactPhone} type="tel" inputMode="tel" autoComplete="tel" placeholder="0812 3456 7890" required />
      </Field>

      <details open={bukaDetail} className="group rounded-besar border-2 border-nonaktif-tepi bg-krem-terang">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold outline-none focus-visible:outline-3 focus-visible:outline-hijau">
          <span className="flex flex-col">
            Tampilan & detail
            <span className="text-xs font-normal text-teks-2">Logo, warna, tahun berdiri, deskripsi (opsional)</span>
          </span>
          <CaretDownIcon className="size-5 shrink-0 text-hijau transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="flex flex-col gap-4 px-4 pt-1 pb-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold">Logo club</span>
            <UnggahGambar
              id="logo"
              name="logo"
              judul="Unggah logo"
              keterangan="PNG/JPG/WebP, maks 2 MB. Tanpa logo dipakai lambang otomatis."
              gambarLama={awal.logoPath}
              invalid={!!e.logo}
              describedBy={e.logo ? idPesan("logo") : undefined}
            />
            {e.logo && <p id={idPesan("logo")} role="alert" className="text-[13px] font-bold text-merah">{e.logo}</p>}
          </div>
          {(
            [
              ["crestColor", "Warna lambang"],
              ["jerseyHome", "Jersey kandang"],
              ["jerseyAway", "Jersey tandang"],
            ] as const
          ).map(([k, label]) => (
            <div key={k} className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{label}</span>
              <PilihWarna name={k} label={label} defaultValue={v[k] || (k === "jerseyAway" ? "#fbf8f1" : undefined)} invalid={!!e[k]} />
              {e[k] && <p className="text-[13px] font-bold text-merah">{e[k]}</p>}
            </div>
          ))}
          <Field id="foundedYear" label="Tahun berdiri" opsional error={e.foundedYear} className={K}>
            <Input {...propsKolom("foundedYear", e.foundedYear)} className="h-12" defaultValue={v.foundedYear} inputMode="numeric" placeholder="mis. 2018" maxLength={4} />
          </Field>
          <Field id="description" label="Deskripsi" opsional error={e.description} hint="Maks 500 karakter." className={K}>
            <Textarea {...propsKolom("description", e.description, true)} className="min-h-20" defaultValue={v.description} maxLength={500} placeholder="mis. Main tiap Sabtu malam, terbuka untuk mini soccer & 11v11." />
          </Field>
        </div>
      </details>

      <TombolKirim size="b" className="w-full md:w-auto md:self-end">
        {tombol}
      </TombolKirim>
    </form>
  )
}
