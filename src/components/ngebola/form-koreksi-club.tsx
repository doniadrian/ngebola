"use client"

import { useActionState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AREA, LABEL_LEVEL, LEVEL } from "@/db/enums"
import type { FormState } from "@/lib/form-state"
import { koreksiClubAction } from "@/server/actions/platform"
import { Field } from "./field"
import { TombolKirim } from "./tombol-kirim"
import { Banner } from "./umpan-balik"

export function FormKoreksiClub({ clubId, awal }: { clubId: string; awal: { name: string; area: string; level: string } }) {
  const [state, action] = useActionState(koreksiClubAction.bind(null, clubId), {} as FormState)
  const v = { ...awal, ...state.values }
  return (
    <form action={action} data-boleh-reset className="flex flex-col gap-4">
      {state.ok && <Banner jenis="saran">{state.message}</Banner>}
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <div className="grid gap-4 md:grid-cols-3">
        <Field id="k-name" label="Nama club">
          <Input id="k-name" name="name" defaultValue={v.name} maxLength={60} />
        </Field>
        <Field id="k-area" label="Area">
          <Select name="area" defaultValue={v.area}>
            <SelectTrigger id="k-area">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AREA.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="k-level" label="Level">
          <Select name="level" defaultValue={v.level}>
            <SelectTrigger id="k-level">
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
      <Field id="k-alasan" label="Alasan koreksi" hint="Minimal 10 karakter. Tercatat di log audit.">
        <Textarea id="k-alasan" name="alasan" maxLength={500} className="min-h-20" />
      </Field>
      <TombolKirim variant="garis" className="self-end">Simpan Koreksi</TombolKirim>
    </form>
  )
}
