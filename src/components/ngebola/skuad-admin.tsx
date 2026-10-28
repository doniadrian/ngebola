"use client"

import { useState, useTransition } from "react"
import { CheckIcon, CopyIcon, LinkIcon, ShareNetworkIcon, UserMinusIcon, XIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/sonner"
import { buatUndanganAction, keluarkanAnggotaAction, putuskanPermintaanAction } from "@/server/actions/skuad"

async function salin(teks: string, pesan: string) {
  try {
    await navigator.clipboard.writeText(teks)
    toast.berhasil(pesan)
  } catch {
    toast.gagal("Tidak bisa menyalin otomatis. Salin manual, ya.")
  }
}

export function SalinKode({ kode }: { kode: string }) {
  return (
    <Button variant="garis" size="k" onClick={() => salin(kode, "Kode skuad disalin")}>
      <CopyIcon aria-hidden />
      Salin kode
    </Button>
  )
}

/** Buat tautan undangan (berlaku 7 hari), lalu salin atau bagikan ke grup WhatsApp lewat menu bagikan perangkat. */
export function TautanUndangan({ namaClub }: { namaClub: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const buat = () =>
    start(async () => {
      const r = await buatUndanganAction()
      if (r.ok) setUrl(r.url)
      else toast.gagal(r.error)
    })
  const bagikan = async () => {
    if (!url) return
    if (navigator.share) {
      await navigator.share({ title: `Gabung skuad ${namaClub}`, text: `Gabung skuad ${namaClub} di Ngebola:`, url }).catch(() => {})
    } else salin(url, "Tautan undangan disalin")
  }

  if (!url) {
    return (
      <Button variant="garis" onClick={buat} loading={pending}>
        <LinkIcon aria-hidden />
        Buat Tautan Undangan
      </Button>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-tombol border-2 border-nonaktif-tepi bg-white px-3.5 py-3 font-mono text-[13px] break-all">{url}</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="garis" size="k" onClick={() => salin(url, "Tautan undangan disalin")}>
          <CopyIcon aria-hidden />
          Salin
        </Button>
        <Button variant="garis" size="k" onClick={bagikan}>
          <ShareNetworkIcon aria-hidden />
          Bagikan ke Grup
        </Button>
      </div>
      <p className="text-xs text-teks-2">Berlaku 7 hari. Pemain yang membuka tautan tetap perlu kamu setujui.</p>
    </div>
  )
}

export function PutuskanPermintaan({ membershipId, nama }: { membershipId: string; nama: string }) {
  const [pending, start] = useTransition()
  const putuskan = (setuju: boolean) =>
    start(async () => {
      const r = await putuskanPermintaanAction(membershipId, setuju)
      if (r.ok) toast.berhasil(setuju ? `${nama} masuk skuad` : `Permintaan ${nama} ditolak`)
      else toast.gagal(r.error)
    })
  return (
    <div className="flex shrink-0 gap-2">
      <Button variant="teks" size="k" className="min-w-0 px-2" disabled={pending} onClick={() => putuskan(false)} aria-label={`Tolak ${nama}`}>
        <XIcon aria-hidden />
        Tolak
      </Button>
      <Button size="k" disabled={pending} onClick={() => putuskan(true)} aria-label={`Setujui ${nama}`}>
        <CheckIcon aria-hidden />
        Setujui
      </Button>
    </div>
  )
}

export function KeluarkanAnggota({ membershipId, nama }: { membershipId: string; nama: string }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="teks" size="k" className="min-w-0 gap-1.5 px-2 text-merah" aria-label={`Keluarkan ${nama}`}>
          <UserMinusIcon />
          <span className="hidden md:inline">Keluarkan</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keluarkan {nama} dari skuad?</DialogTitle>
          <DialogDescription>{nama} langsung diberi tahu. Konfirmasi ikut (RSVP) untuk match mendatang dihapus; hasil match lama tetap tersimpan.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="bahaya"
            loading={pending}
            onClick={() =>
              start(async () => {
                const r = await keluarkanAnggotaAction(membershipId)
                if (r.ok) {
                  setOpen(false)
                  toast.berhasil(`${nama} dikeluarkan dari skuad`)
                } else toast.gagal(r.error)
              })
            }
          >
            Ya, Keluarkan
          </Button>
          <DialogClose asChild>
            <Button variant="garis">Jangan</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
