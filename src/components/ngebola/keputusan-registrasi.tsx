"use client"

import { useActionState, useState } from "react"
import { CheckIcon, XIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/sonner"
import { Textarea } from "@/components/ui/textarea"
import type { FormState } from "@/lib/form-state"
import { putuskanRegistrasiAction } from "@/server/actions/platform"
import { Field, propsKolom } from "./field"
import { TombolKirim } from "./tombol-kirim"

export function KeputusanRegistrasi({ clubId, nama }: { clubId: string; nama: string }) {
  const [buka, setBuka] = useState(false)
  // Efek samping (toast, tutup dialog) dijalankan setelah action selesai, bukan di effect.
  const [, aksiSetuju] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await putuskanRegistrasiAction(clubId, "setujui", prev, fd)
    if (r.ok) toast.berhasil(`${nama} disetujui`)
    else if (r.error) toast.gagal(r.error)
    return r
  }, {} as FormState)
  const [tolak, aksiTolak] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await putuskanRegistrasiAction(clubId, "tolak", prev, fd)
    if (r.ok) {
      setBuka(false)
      toast.info(`Registrasi ${nama} ditolak`)
    } else if (r.error) toast.gagal(r.error)
    return r
  }, {} as FormState)

  return (
    <div className="flex flex-wrap justify-end gap-3">
      <Dialog open={buka} onOpenChange={setBuka}>
        <DialogTrigger asChild>
          <Button variant="garis">
            <XIcon aria-hidden />
            Tolak
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form action={aksiTolak} className="flex flex-col gap-3.5">
            <DialogHeader>
              <DialogTitle>Tolak registrasi {nama}?</DialogTitle>
              <DialogDescription>Admin club menerima alasan ini lewat aplikasi dan email, lalu bisa memperbaiki dan mengajukan ulang. Tercatat di log audit.</DialogDescription>
            </DialogHeader>
            <Field id={`alasan-${clubId}`} label="Alasan penolakan" error={tolak.fieldErrors?.alasan}>
              <Textarea {...propsKolom(`alasan-${clubId}`, tolak.fieldErrors?.alasan)} name="alasan" defaultValue={tolak.values?.alasan} maxLength={500} placeholder="mis. Nomor kontak pengurus tidak bisa dihubungi." />
            </Field>
            <DialogFooter>
              <TombolKirim variant="bahaya">Ya, Tolak Registrasi</TombolKirim>
              <DialogClose asChild>
                <Button variant="garis" type="button">Batal</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <form action={aksiSetuju}>
        <TombolKirim>
          <CheckIcon aria-hidden />
          Setujui
        </TombolKirim>
      </form>
    </div>
  )
}
