"use client"

import { useActionState, useState } from "react"
import { TrashIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { FormState } from "@/lib/form-state"
import { hapusAkunAction } from "@/server/actions/akun"
import { Field, propsKolom } from "./field"
import { KolomPassword } from "./kolom-password"
import { TombolKirim } from "./tombol-kirim"
import { Banner } from "./umpan-balik"

/** Hak hapus akun (UU PDP). Dialog Bahaya: akibat disebut jelas, wajib konfirmasi password. */
export function HapusAkun() {
  const [buka, setBuka] = useState(false)
  const [state, action] = useActionState(hapusAkunAction, {} as FormState)
  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger asChild>
        <Button variant="teks" className="self-start text-merah">
          <TrashIcon aria-hidden />
          Hapus akun
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} noValidate className="flex flex-col gap-3.5">
          <DialogHeader>
            <DialogTitle>Hapus akunmu?</DialogTitle>
            <DialogDescription>
              Nama, email, tanggal lahir, foto, profil, dan pemberitahuanmu dihapus, kamu keluar dari skuad, dan konfirmasi ikutmu untuk match mendatang dibatalkan. Hasil match tetap tersimpan tanpa identitasmu. <b className="text-tinta">Ini tidak bisa dibatalkan.</b>
            </DialogDescription>
          </DialogHeader>
          {state.error && <Banner jenis="gagal">{state.error}</Banner>}
          <Field id="hapus-password" label="Masukkan password untuk konfirmasi" error={state.fieldErrors?.password}>
            <KolomPassword {...propsKolom("hapus-password")} name="password" autoComplete="current-password" required />
          </Field>
          <DialogFooter>
            <TombolKirim variant="bahaya">Ya, Hapus Akun</TombolKirim>
            <DialogClose asChild>
              <Button variant="garis" type="button">Jangan, Simpan Akunku</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
