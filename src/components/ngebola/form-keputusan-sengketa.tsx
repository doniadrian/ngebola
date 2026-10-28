"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { RadioCard, RadioGroup } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/sonner"
import { Textarea } from "@/components/ui/textarea"
import type { FormState } from "@/lib/form-state"
import { putuskanSengketaAction } from "@/server/actions/hari-h"
import { Field } from "./field"
import { TombolKirim } from "./tombol-kirim"
import { Banner } from "./umpan-balik"

/** Opsi keputusan PRD 9.3; alasan wajib dan dikirim ke kedua club. */
export function FormKeputusanSengketa({ matchId, pembuat, lawan, usulan, sanggahan }: { matchId: string; pembuat: string; lawan: string; usulan: string; sanggahan: string }) {
  const router = useRouter()
  const [pilih, setPilih] = useState("")
  const [state, action] = useActionState(async (p: FormState, fd: FormData) => {
    const r = await putuskanSengketaAction(matchId, p, fd)
    if (r.ok) {
      toast.berhasil("Keputusan tersimpan")
      router.refresh()
    }
    return r
  }, {} as FormState)
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-bold">Keputusan</legend>
        <RadioGroup name="keputusan" value={pilih} onValueChange={setPilih} className="md:grid-cols-2">
          <RadioCard value="pengusul" judul="Sahkan skor pengusul" keterangan={usulan} />
          <RadioCard value="penyanggah" judul="Sahkan skor penyanggah" keterangan={sanggahan} />
          <RadioCard value="koreksi" judul="Koreksi skor" keterangan="Berdasarkan bukti" />
          <RadioCard value="batal" judul="Batalkan dari catatan" keterangan="Tanpa pembaruan rating" />
        </RadioGroup>
        {state.fieldErrors?.keputusan && <p className="text-[13px] font-bold text-merah">{state.fieldErrors.keputusan}</p>}
      </fieldset>
      {pilih === "koreksi" && (
        <div className="grid grid-cols-2 gap-3">
          <Field id="koreksi-a" label={pembuat}>
            <Input id="koreksi-a" name="skorPembuat" inputMode="numeric" maxLength={2} className="text-center text-2xl font-extrabold" />
          </Field>
          <Field id="koreksi-b" label={lawan}>
            <Input id="koreksi-b" name="skorLawan" inputMode="numeric" maxLength={2} className="text-center text-2xl font-extrabold" />
          </Field>
        </div>
      )}
      <Field id="alasan-keputusan" label="Alasan keputusan" hint="Dikirim ke kedua club (aplikasi + email) dan tercatat di log audit.">
        <Textarea id="alasan-keputusan" name="alasan" maxLength={1000} className="min-h-24" defaultValue={state.values?.alasan} />
      </Field>
      <TombolKirim size="b" className="self-end">Simpan Keputusan</TombolKirim>
    </form>
  )
}
