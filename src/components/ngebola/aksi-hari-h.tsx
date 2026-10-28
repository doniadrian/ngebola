"use client"

import { useActionState, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, MapPinIcon, PlayIcon, StarIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RadioGroup as RG } from "radix-ui"
import { toast } from "@/components/ui/sonner"
import { Textarea } from "@/components/ui/textarea"
import type { FormState } from "@/lib/form-state"
import { cn } from "@/lib/utils"
import { checkInAction, konfirmasiHasilAction, mulaiAction, penilaianAction, tambahBuktiAction } from "@/server/actions/hari-h"
import { Field } from "./field"
import { TombolKirim } from "./tombol-kirim"
import { Banner } from "./umpan-balik"

/** Check-in di lokasi (D-01). Lokasi GPS opsional dan hanya diambil saat dicentang (minimisasi data, PRD 12.1). */
export function TombolCheckIn({ matchId }: { matchId: string }) {
  const [gps, setGps] = useState(false)
  const [pending, start] = useTransition()
  const router = useRouter()
  const kirim = (lokasi: { lat: number; lng: number } | null) =>
    start(async () => {
      const r = await checkInAction(matchId, lokasi)
      if (r.ok) {
        toast.berhasil("Check-in tercatat")
        router.refresh()
      } else toast.gagal(r.error ?? "Gagal check-in.")
    })
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={gps} onCheckedChange={(v) => setGps(v === true)} />
        Sertakan lokasi GPS (opsional)
      </label>
      <Button
        size="b"
        className="w-full md:w-auto md:self-start"
        loading={pending}
        onClick={() => {
          if (!gps || !navigator.geolocation) return kirim(null)
          navigator.geolocation.getCurrentPosition(
            (p) => kirim({ lat: Number(p.coords.latitude.toFixed(5)), lng: Number(p.coords.longitude.toFixed(5)) }),
            () => {
              toast.info("Lokasi tidak diizinkan. Check-in tanpa GPS.")
              kirim(null)
            },
            { timeout: 10000 },
          )
        }}
      >
        <MapPinIcon aria-hidden />
        Check-in Sekarang
      </Button>
    </div>
  )
}

export function TombolMulai({ matchId }: { matchId: string }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  return (
    <Button
      size="b"
      className="w-full md:w-auto md:self-start"
      loading={pending}
      onClick={() =>
        start(async () => {
          const r = await mulaiAction(matchId)
          if (r.ok) {
            toast.berhasil("Kick-off! Kamu pencatat skor.")
            router.refresh()
          } else toast.gagal(r.error ?? "Gagal memulai.")
        })
      }
    >
      <PlayIcon aria-hidden />
      Mulai Match & Catat Skor
    </Button>
  )
}

/** Konfirmasi atau sanggah skor akhir (H-01, H-02). */
export function KonfirmasiHasil({ matchId, pembuat, lawan }: { matchId: string; pembuat: string; lawan: string }) {
  const router = useRouter()
  const [, setuju] = useActionState(async (p: FormState, fd: FormData) => {
    const r = await konfirmasiHasilAction(matchId, true, p, fd)
    if (r.ok) {
      toast.berhasil("Hasil dikonfirmasi. Rating diperbarui.")
      router.refresh()
    } else if (r.error) toast.gagal(r.error)
    return r
  }, {} as FormState)
  const [buka, setBuka] = useState(false)
  const [sanggah, aksiSanggah] = useActionState(async (p: FormState, fd: FormData) => {
    const r = await konfirmasiHasilAction(matchId, false, p, fd)
    if (r.ok) {
      setBuka(false)
      toast.info("Sanggahan terkirim. Sengketa dibuka.")
      router.refresh()
    }
    return r
  }, {} as FormState)
  return (
    <div className="flex flex-wrap justify-end gap-3">
      <Dialog open={buka} onOpenChange={setBuka}>
        <DialogTrigger asChild>
          <Button variant="garis">Sanggah</Button>
        </DialogTrigger>
        <DialogContent>
          <form action={aksiSanggah} noValidate className="flex flex-col gap-3.5">
            <DialogHeader>
              <DialogTitle>Sanggah skor akhir?</DialogTitle>
              <DialogDescription>Sengketa dibuka. Kedua club punya 48 jam untuk melampirkan bukti; Admin platform memutus dalam 3 hari kerja. Tanpa bukti dari club kamu, skor pengusul disahkan.</DialogDescription>
            </DialogHeader>
            {sanggah.error && <Banner jenis="gagal">{sanggah.error}</Banner>}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-bold">Skor menurut club kamu</legend>
              <div className="grid grid-cols-2 gap-3">
                <Field id="skorPembuat" label={pembuat}>
                  <Input id="skorPembuat" name="skorPembuat" inputMode="numeric" maxLength={2} defaultValue={sanggah.values?.skorPembuat} className="text-center text-2xl font-extrabold" />
                </Field>
                <Field id="skorLawan" label={lawan}>
                  <Input id="skorLawan" name="skorLawan" inputMode="numeric" maxLength={2} defaultValue={sanggah.values?.skorLawan} className="text-center text-2xl font-extrabold" />
                </Field>
              </div>
              {sanggah.fieldErrors?.skor && <p className="text-[13px] font-bold text-merah">{sanggah.fieldErrors.skor}</p>}
            </fieldset>
            <DialogFooter>
              <TombolKirim variant="bahaya">Ya, Sanggah</TombolKirim>
              <DialogClose asChild>
                <Button variant="garis" type="button">Batal</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <form action={setuju}>
        <TombolKirim>
          <CheckIcon aria-hidden />
          Setuju
        </TombolKirim>
      </form>
    </div>
  )
}

export function FormBukti({ matchId }: { matchId: string }) {
  const router = useRouter()
  const [state, action] = useActionState(async (p: FormState, fd: FormData) => {
    const r = await tambahBuktiAction(matchId, p, fd)
    if (r.ok) {
      toast.berhasil("Bukti terkirim")
      router.refresh()
    }
    return r
  }, {} as FormState)
  return (
    <form action={action} noValidate data-boleh-reset className="flex flex-col gap-3">
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <Field id="url-bukti" label="Tautan bukti" opsional hint="Foto papan skor / video di Google Drive, YouTube, dll. Tidak ada unggah file.">
        <Input id="url-bukti" name="url" type="url" inputMode="url" maxLength={500} placeholder="https://" defaultValue={state.ok ? "" : state.values?.url} />
      </Field>
      <Field id="catatan-bukti" label="Penjelasan">
        <Textarea id="catatan-bukti" name="catatan" maxLength={1000} className="min-h-20" defaultValue={state.ok ? "" : state.values?.catatan} placeholder="mis. Menit 70 bola belum melewati garis" />
      </Field>
      <TombolKirim variant="garis" className="self-end">Kirim Bukti</TombolKirim>
    </form>
  )
}

function Bintang({ name, label }: { name: string; label: string }) {
  const [nilai, setNilai] = useState("")
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-bold">{label}</legend>
      <RG.Root name={name} value={nilai} onValueChange={setNilai} required className="flex gap-1.5" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <RG.Item
            key={n}
            value={String(n)}
            aria-label={`${n} dari 5`}
            className="flex size-11 items-center justify-center rounded-kecil text-emas transition-[scale] duration-200 ease-pegas tekan:scale-90 tekan:duration-60 tekan:ease-out outline-none focus-visible:outline-3 focus-visible:outline-hijau"
          >
            <StarIcon weight={Number(nilai) >= n ? "fill" : "bold"} className={cn("size-7", Number(nilai) >= n ? "text-emas" : "text-nonaktif-tepi")} />
          </RG.Item>
        ))}
      </RG.Root>
    </fieldset>
  )
}

/** Penilaian sportivitas & kerapian 1–5 + komentar ≤ 200 (H-06). */
export function FormPenilaian({ matchId, lawan }: { matchId: string; lawan: string }) {
  const router = useRouter()
  const [state, action] = useActionState(async (p: FormState, fd: FormData) => {
    const r = await penilaianAction(matchId, p, fd)
    if (r.ok) {
      toast.berhasil("Penilaian tersimpan")
      router.refresh()
    }
    return r
  }, {} as FormState)
  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-teks-2">Nilai {lawan}. Penilaianmu tersembunyi sampai {lawan} juga mengisi atau 7 hari berlalu.</p>
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <div className="grid gap-4 md:grid-cols-2">
        <Bintang name="sportivitas" label="Sportivitas" />
        <Bintang name="kerapian" label="Kerapian (datang tepat waktu, rapi)" />
      </div>
      <Field id="komentar" label="Komentar" opsional>
        <Textarea id="komentar" name="komentar" maxLength={200} className="min-h-20" placeholder="Maks 200 karakter" />
      </Field>
      <TombolKirim variant="garis" className="self-end">Kirim Penilaian</TombolKirim>
    </form>
  )
}
