"use client"

import { useActionState, useState, useTransition } from "react"
import { SignOutIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/sonner"
import type { FormState } from "@/lib/form-state"
import { keluarSkuadAction, mintaGabungAction } from "@/server/actions/skuad"
import { Field, propsKolom } from "./field"
import { TombolKirim } from "./tombol-kirim"
import { Banner } from "./umpan-balik"

export function FormKodeSkuad() {
  const [state, action] = useActionState(mintaGabungAction, {} as FormState)
  const e = state.fieldErrors ?? {}
  if (state.ok) return <Banner jenis="saran" judul="Permintaan terkirim">{state.message}</Banner>
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <Field id="kode" label="Kode skuad" hint="6 huruf/angka dari admin club-mu." error={e.kode}>
        <Input
          {...propsKolom("kode", e.kode, true)}
          defaultValue={state.values?.kode}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={6}
          placeholder="mis. K7Q2MX"
          className="font-mono text-xl tracking-[.3em] uppercase"
          required
        />
      </Field>
      <TombolKirim className="w-full md:w-auto md:self-start">Minta Gabung</TombolKirim>
    </form>
  )
}

export function FormUndangan({ token, namaClub }: { token: string; namaClub: string }) {
  const [state, action] = useActionState(mintaGabungAction, {} as FormState)
  if (state.ok) return <Banner jenis="saran" judul="Permintaan terkirim">{state.message}</Banner>
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <TombolKirim size="b" className="w-full">
        Minta Gabung {namaClub}
      </TombolKirim>
    </form>
  )
}

export function KeluarSkuad({ namaClub }: { namaClub: string }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="bahaya" className="w-full md:w-auto">
          <SignOutIcon aria-hidden />
          Keluar dari Skuad
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keluar dari {namaClub}?</DialogTitle>
          <DialogDescription>Admin club diberi tahu. Konfirmasi ikut untuk match mendatang dihapus. Untuk kembali, kamu perlu minta gabung dan disetujui lagi.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="bahaya"
            loading={pending}
            onClick={() =>
              start(async () => {
                const r = await keluarSkuadAction()
                if (r.ok) {
                  setOpen(false)
                  toast.berhasil(`Kamu keluar dari ${namaClub}`)
                } else toast.gagal(r.error)
              })
            }
          >
            Ya, Keluar
          </Button>
          <DialogClose asChild>
            <Button variant="garis">Jangan</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
