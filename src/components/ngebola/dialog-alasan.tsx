"use client"

import { useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/sonner"
import { Textarea } from "@/components/ui/textarea"
import { aksiAlasanAction } from "@/server/actions/platform"

/** Aksi Admin platform yang wajib beralasan (PRD 2, 9.1): alasan tercatat di log audit. */
export function DialogAlasan({
  jenis,
  targetId,
  pemicu,
  varianPemicu = "garis",
  judul,
  deskripsi,
  label,
  bahaya = false,
  min = 10,
  berhasil,
}: {
  jenis: string
  targetId: string
  pemicu: ReactNode
  varianPemicu?: ButtonProps["variant"]
  judul: string
  deskripsi: ReactNode
  label: string
  bahaya?: boolean
  min?: number
  berhasil: string
}) {
  const [buka, setBuka] = useState(false)
  const [alasan, setAlasan] = useState("")
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger asChild>
        <Button variant={varianPemicu} size="k">
          {pemicu}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{judul}</DialogTitle>
          <DialogDescription>{deskripsi}</DialogDescription>
        </DialogHeader>
        <label className="flex flex-col gap-2 text-sm font-bold">
          Alasan / catatan
          <Textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} maxLength={500} className="min-h-24 font-normal" />
          <span className="text-xs font-normal text-teks-2">Minimal {min} karakter. Tercatat di log audit.</span>
        </label>
        <DialogFooter>
          <Button
            variant={bahaya ? "bahaya" : "utama"}
            loading={pending}
            disabled={alasan.trim().length < min}
            onClick={() =>
              start(async () => {
                const r = await aksiAlasanAction(jenis, targetId, alasan)
                if (r.ok) {
                  setBuka(false)
                  setAlasan("")
                  toast.berhasil(berhasil)
                  router.refresh()
                } else toast.gagal(r.error ?? "Gagal.")
              })
            }
          >
            {label}
          </Button>
          <DialogClose asChild>
            <Button variant="garis">Batal</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
