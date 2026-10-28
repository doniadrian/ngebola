"use client"

import { useActionState } from "react"
import { Field, idPesan, propsKolom } from "@/components/ngebola/field"
import { TombolKirim } from "@/components/ngebola/tombol-kirim"
import { UnggahGambar } from "@/components/ngebola/unggah-gambar"
import { Banner } from "@/components/ngebola/umpan-balik"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RadioCard, RadioGroup } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AREA, LABEL_POSISI, POSISI } from "@/db/enums"
import type { FormState } from "@/lib/form-state"
import { simpanProfilPemainAction } from "@/server/actions/pemain"

const KAKI = { kanan: "Kanan", kiri: "Kiri", keduanya: "Keduanya" }

export function FormProfilPemain({ awal }: { awal: { name: string; position: string | null; dominantFoot: string | null; area: string | null; photoPath: string | null } }) {
  const [state, action] = useActionState(simpanProfilPemainAction, {} as FormState)
  const e = state.fieldErrors ?? {}
  const v = { name: awal.name, position: awal.position ?? "", dominantFoot: awal.dominantFoot ?? "", area: awal.area ?? "", ...state.values }
  return (
    <form action={action} noValidate className="flex flex-col gap-3.5">
      {state.ok && <Banner jenis="saran">{state.message}</Banner>}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold">Foto <span className="font-semibold text-teks-2">(opsional)</span></span>
        <UnggahGambar id="foto" name="foto" bulat judul="Unggah foto" keterangan="PNG/JPG/WebP, maks 2 MB. Tanpa foto, kamu memakai avatar ilustrasi." gambarLama={awal.photoPath} invalid={!!e.foto} describedBy={e.foto ? idPesan("foto") : undefined} />
        {e.foto && <p id={idPesan("foto")} role="alert" className="text-[13px] font-bold text-merah">{e.foto}</p>}
        {awal.photoPath && (
          <label className="flex items-center gap-3 text-sm">
            <Checkbox name="hapusFoto" value="1" /> Hapus foto, pakai avatar ilustrasi
          </label>
        )}
      </div>
      <Field id="name" label="Nama" error={e.name} className="gap-1.5">
        <Input {...propsKolom("name", e.name)} className="h-12" defaultValue={v.name} autoComplete="name" required />
      </Field>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-bold">Posisi utama</legend>
        <RadioGroup name="position" defaultValue={v.position || undefined} className="grid-cols-2 gap-2">
          {POSISI.map((p) => (
            <RadioCard key={p} value={p} judul={LABEL_POSISI[p]} className="px-3 py-2.5" />
          ))}
        </RadioGroup>
        {e.position && <p className="text-[13px] font-bold text-merah">{e.position}</p>}
      </fieldset>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-bold">Kaki dominan</legend>
        <RadioGroup name="dominantFoot" defaultValue={v.dominantFoot || undefined} className="grid-cols-3 gap-2">
          {Object.entries(KAKI).map(([k, l]) => (
            <RadioCard key={k} value={k} judul={l} className="px-2.5 py-2.5" />
          ))}
        </RadioGroup>
      </fieldset>
      <Field id="area" label="Area" opsional error={e.area} className="gap-1.5">
        <Select name="area" defaultValue={v.area || undefined}>
          <SelectTrigger id="area" className="h-12">
            <SelectValue placeholder="Pilih kecamatan" />
          </SelectTrigger>
          <SelectContent>
            {AREA.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <p className="text-[13px] text-teks-2">Profilmu hanya terlihat oleh admin club, sesama anggota skuad, dan Admin platform. Tidak pernah tampil di halaman publik.</p>
      <TombolKirim size="b" className="w-full md:w-auto md:self-end">Simpan Profil</TombolKirim>
    </form>
  )
}
