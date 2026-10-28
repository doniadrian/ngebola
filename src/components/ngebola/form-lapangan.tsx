"use client"

import { useActionState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AREA, NAMA_HARI } from "@/db/enums"
import type { FormState } from "@/lib/form-state"
import { simpanVenueAction, tambahSlotAction } from "@/server/actions/platform"
import { Field } from "./field"
import { TombolKirim } from "./tombol-kirim"
import { Banner } from "./umpan-balik"

type Awal = {
  name?: string
  address?: string
  area?: string
  lat?: number | null
  lng?: number | null
  surface?: string
  forFootball?: boolean
  forMini?: boolean
  pricePerHour?: number | null
  openHours?: string | null
  facilities?: string | null
  contact?: string | null
  verified?: boolean
}

/** Profil lapangan di direktori (PRD V-01, V-05). Dikelola Admin platform. */
export function FormLapangan({ id, awal = {} }: { id: string | null; awal?: Awal }) {
  const [state, action] = useActionState(simpanVenueAction.bind(null, id), {} as FormState)
  const v = { ...Object.fromEntries(Object.entries(awal).map(([k, x]) => [k, x == null ? "" : String(x)])), ...state.values }
  const cek = (k: "forFootball" | "forMini" | "verified") => (state.values ? state.values[k] === "on" : !!awal[k])
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.ok && <Banner jenis="saran">{state.message}</Banner>}
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="v-name" label="Nama lapangan">
          <Input id="v-name" name="name" defaultValue={v.name} maxLength={100} />
        </Field>
        <Field id="v-area" label="Area">
          <Select name="area" defaultValue={v.area || undefined}>
            <SelectTrigger id="v-area">
              <SelectValue placeholder="Pilih kecamatan" />
            </SelectTrigger>
            <SelectContent>
              {AREA.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field id="v-address" label="Alamat">
        <Input id="v-address" name="address" defaultValue={v.address} maxLength={200} />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field id="v-surface" label="Permukaan">
          <Select name="surface" defaultValue={v.surface || "sintetis"}>
            <SelectTrigger id="v-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sintetis">Rumput sintetis</SelectItem>
              <SelectItem value="alami">Rumput alami</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field id="v-lat" label="Lintang (lat)" opsional hint="Untuk tautan peta.">
          <Input id="v-lat" name="lat" inputMode="decimal" defaultValue={v.lat} placeholder="0.5071" />
        </Field>
        <Field id="v-lng" label="Bujur (lng)" opsional>
          <Input id="v-lng" name="lng" inputMode="decimal" defaultValue={v.lng} placeholder="101.4478" />
        </Field>
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-bold">Format & status</legend>
        <label className="flex items-center gap-3 text-[15px]">
          <Checkbox name="forFootball" defaultChecked={cek("forFootball")} /> Football 11v11
        </label>
        <label className="flex items-center gap-3 text-[15px]">
          <Checkbox name="forMini" defaultChecked={cek("forMini")} /> Mini soccer
        </label>
        <label className="flex items-center gap-3 text-[15px]">
          <Checkbox name="verified" defaultChecked={cek("verified")} /> Terverifikasi Admin platform
        </label>
      </fieldset>
      <div className="grid gap-4 md:grid-cols-3">
        <Field id="v-price" label="Harga per jam (Rp)" opsional>
          <Input id="v-price" name="pricePerHour" inputMode="numeric" defaultValue={v.pricePerHour} placeholder="250000" />
        </Field>
        <Field id="v-hours" label="Jam buka" opsional>
          <Input id="v-hours" name="openHours" defaultValue={v.openHours} maxLength={60} placeholder="07.00–23.00" />
        </Field>
        <Field id="v-contact" label="Kontak" opsional>
          <Input id="v-contact" name="contact" defaultValue={v.contact} maxLength={60} />
        </Field>
      </div>
      <Field id="v-fac" label="Fasilitas" opsional>
        <Textarea id="v-fac" name="facilities" defaultValue={v.facilities} maxLength={300} className="min-h-20" placeholder="Parkir, toilet, musala, kantin" />
      </Field>
      <TombolKirim className="self-end">{id ? "Simpan Lapangan" : "Tambah Lapangan"}</TombolKirim>
    </form>
  )
}

const JAM = Array.from({ length: 36 }, (_, i) => `${String(6 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`)

/** Info slot (V-02): informasi saja, tidak bisa dipesan. */
export function FormSlot({ venueId }: { venueId: string }) {
  const [state, action] = useActionState(tambahSlotAction.bind(null, venueId), {} as FormState)
  return (
    <form action={action} data-boleh-reset className="flex flex-col gap-3">
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <div className="grid grid-cols-3 gap-2">
        <Select name="dayOfWeek" defaultValue="6">
          <SelectTrigger aria-label="Hari">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NAMA_HARI.map((h, i) => (
              <SelectItem key={h} value={String(i)}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(["startTime", "endTime"] as const).map((k) => (
          <Select key={k} name={k} defaultValue={k === "startTime" ? "19:00" : "21:00"}>
            <SelectTrigger aria-label={k === "startTime" ? "Jam mulai" : "Jam selesai"}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {JAM.map((j) => (
                <SelectItem key={j} value={j}>{j.replace(":", ".")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
      <Input name="note" aria-label="Catatan slot" maxLength={100} placeholder="Catatan (opsional), mis. biasanya kosong" />
      <TombolKirim variant="garis" size="k" className="self-end">Tambah Slot</TombolKirim>
    </form>
  )
}

