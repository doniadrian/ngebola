"use client"

import { useActionState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { FormState } from "@/lib/form-state"
import { simpanPengaturanAction } from "@/server/actions/platform"
import { Field } from "./field"
import { TombolKirim } from "./tombol-kirim"
import { Banner } from "./umpan-balik"

export function FormPengaturan({ awal }: { awal: { key: string; label: string; nilai: number; min: number; max: number }[] }) {
  const [state, action] = useActionState(simpanPengaturanAction, {} as FormState)
  return (
    <form action={action} data-boleh-reset className="flex flex-col gap-4">
      {state.ok && <Banner jenis="saran">{state.message}</Banner>}
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <div className="grid gap-4 md:grid-cols-2">
        {awal.map((p) => (
          <Field key={p.key} id={p.key} label={p.label} hint={`${p.min}–${p.max}`}>
            <Input id={p.key} name={p.key} inputMode="numeric" defaultValue={state.values?.[p.key] ?? p.nilai} />
          </Field>
        ))}
      </div>
      <Field id="alasan-pengaturan" label="Alasan perubahan" hint="Minimal 10 karakter. Tercatat di log audit.">
        <Textarea id="alasan-pengaturan" name="alasan" maxLength={500} className="min-h-20" />
      </Field>
      <TombolKirim className="self-end">Simpan Pengaturan</TombolKirim>
    </form>
  )
}
