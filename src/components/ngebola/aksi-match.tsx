"use client"

import { useActionState, useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ArrowsLeftRightIcon, CalendarBlankIcon, CheckIcon, MapPinIcon, MinusIcon, PauseIcon, PlusIcon, XIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/components/ui/sonner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ALASAN_BATAL, LABEL_ALASAN_BATAL, MIN_PEMAIN, type Format } from "@/db/enums"
import type { FormState } from "@/lib/form-state"
import { formatJadwal, formatRupiah } from "@/lib/waktu"
import { cn } from "@/lib/utils"
import {
  ajukanPerubahanAction,
  batalkanAction,
  hapusDrafAction,
  kesiapanAction,
  putuskanPerubahanAction,
  tarikAction,
  tawarBalikAction,
  terbitkanDrafAction,
  terimaAction,
  tolakAction,
} from "@/server/actions/match"
import { EditorUsulan, type VenueOpsi } from "./editor-usulan"
import { Field } from "./field"
import { TombolKirim } from "./tombol-kirim"
import { Banner } from "./umpan-balik"

type Hasil = { ok: boolean; error?: string }

/** Jalankan aksi server lalu beri toast; halaman diperbarui lewat revalidatePath. */
function useAksi() {
  const [pending, start] = useTransition()
  const router = useRouter()
  const jalankan = (fn: () => Promise<Hasil>, berhasil: string, setelah?: () => void) =>
    start(async () => {
      const r = await fn()
      if (r.ok) {
        toast.berhasil(berhasil)
        setelah?.()
        router.refresh()
      } else toast.gagal(r.error ?? "Gagal. Coba lagi.")
    })
  return { pending, jalankan }
}

export type OpsiUsulan = { id: string; startsAt: string; lapangan: string | null; manual: boolean; feeTotal: number | null }

function DaftarOpsi({ opsi, nilai, onChange, baca }: { opsi: OpsiUsulan[]; nilai?: string; onChange?: (v: string) => void; baca?: boolean }) {
  if (baca) {
    return (
      <ul className="flex flex-col gap-2">
        {opsi.map((o) => (
          <li key={o.id} className="flex flex-col gap-0.5 rounded-tombol border-2 border-nonaktif-tepi px-3.5 py-2.5">
            <span className="text-[15px] font-extrabold">{formatJadwal(new Date(o.startsAt))} WIB</span>
            <span className="text-xs text-teks-2">{[o.lapangan ? `${o.lapangan}${o.manual ? " (belum terverifikasi)" : ""}` : "Lapangan belum ditentukan", o.feeTotal ? formatRupiah(o.feeTotal) : null].filter(Boolean).join(" · ")}</span>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <RadioGroup value={nilai} onValueChange={onChange} aria-label="Pilih opsi jadwal">
      {opsi.map((o) => (
        <label
          key={o.id}
          htmlFor={`opsi-${o.id}`}
          className="flex cursor-pointer items-center gap-3 rounded-tombol border-2 border-nonaktif-tepi px-3.5 py-3 has-[[data-state=checked]]:border-hijau has-[[data-state=checked]]:bg-krem-terang has-[[data-state=checked]]:shadow-keras-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hijau"
        >
          <RadioGroupItem value={o.id} id={`opsi-${o.id}`} className="focus-visible:outline-none" />
          <span className="flex flex-col">
            <span className="text-[15px] font-extrabold">{formatJadwal(new Date(o.startsAt))} WIB</span>
            <span className="text-xs text-teks-2">{[o.lapangan ? `${o.lapangan}${o.manual ? " (belum terverifikasi)" : ""}` : "Lapangan belum ditentukan", o.feeTotal ? formatRupiah(o.feeTotal) : null].filter(Boolean).join(" · ")}</span>
          </span>
        </label>
      ))}
    </RadioGroup>
  )
}

export function LihatOpsi({ opsi }: { opsi: OpsiUsulan[] }) {
  return <DaftarOpsi opsi={opsi} baca />
}

/** Respons ajakan: pilih satu opsi → Terima; atau Tawar (sheet) / Tolak (dialog). Satu tombol Utama. */
export function ResponsAjakan({ matchId, opsi, venues, format, bolehTolak, bolehTawar, putaran, maksPutaran }: { matchId: string; opsi: OpsiUsulan[]; venues: VenueOpsi[]; format: Format; bolehTolak: boolean; bolehTawar: boolean; putaran: number; maksPutaran: number }) {
  const [pilih, setPilih] = useState(opsi.length === 1 ? opsi[0].id : undefined)
  const { pending, jalankan } = useAksi()
  return (
    <div className="flex flex-col gap-4">
      <DaftarOpsi opsi={opsi} nilai={pilih} onChange={setPilih} />
      <div className="flex flex-wrap items-center justify-end gap-3">
        {bolehTolak && <TolakAjakan matchId={matchId} />}
        {bolehTawar && <TawarBalik matchId={matchId} venues={venues} format={format} putaran={putaran} maksPutaran={maksPutaran} />}
        <Button disabled={!pilih} loading={pending} onClick={() => pilih && jalankan(() => terimaAction(matchId, pilih), "Sparring diterima! Match terkonfirmasi.")}>
          <CheckIcon aria-hidden />
          Terima Sparring
        </Button>
      </div>
      {!pilih && <p className="text-right text-[13px] text-teks-2">Pilih satu opsi jadwal dulu.</p>}
    </div>
  )
}

function TolakAjakan({ matchId }: { matchId: string }) {
  const [buka, setBuka] = useState(false)
  const router = useRouter()
  const [state, action] = useActionState(async (p: FormState, fd: FormData) => {
    const r = await tolakAction(matchId, p, fd)
    if (r.ok) {
      setBuka(false)
      toast.info("Ajakan ditolak")
      router.refresh()
    }
    return r
  }, {} as FormState)
  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger asChild>
        <Button variant="teks" className="text-merah">
          <XIcon aria-hidden />
          Tolak
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} className="flex flex-col gap-3.5">
          <DialogHeader>
            <DialogTitle>Tolak ajakan sparring ini?</DialogTitle>
            <DialogDescription>Club lawan langsung diberi tahu. Ajakan ini ditutup dan tidak bisa dibuka lagi.</DialogDescription>
          </DialogHeader>
          {state.error && <Banner jenis="gagal">{state.error}</Banner>}
          <Field id="alasan-tolak" label="Alasan" opsional>
            <Input id="alasan-tolak" name="alasan" maxLength={300} placeholder="mis. Jadwal bentrok dengan turnamen" />
          </Field>
          <DialogFooter>
            <TombolKirim variant="bahaya">Ya, Tolak</TombolKirim>
            <DialogClose asChild>
              <Button variant="garis" type="button">Jangan</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TawarBalik({ matchId, venues, format, putaran, maksPutaran }: { matchId: string; venues: VenueOpsi[]; format: Format; putaran: number; maksPutaran: number }) {
  const [buka, setBuka] = useState(false)
  const router = useRouter()
  const [state, action] = useActionState(async (p: FormState, fd: FormData) => {
    const r = await tawarBalikAction(matchId, p, fd)
    if (r.ok) {
      setBuka(false)
      toast.berhasil("Tawaran terkirim")
      router.refresh()
    }
    return r
  }, {} as FormState)
  return (
    <Sheet open={buka} onOpenChange={setBuka}>
      <SheetTrigger asChild>
        <Button variant="garis">
          <ArrowsLeftRightIcon aria-hidden />
          Tawar
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tawar jadwal</SheetTitle>
          <SheetDescription>
            Putaran {putaran + 1} dari {maksPutaran}. Usulkan 1–3 opsi; lawan punya 72 jam untuk menjawab.
          </SheetDescription>
        </SheetHeader>
        <form action={action} noValidate className="flex flex-col gap-4">
          {state.error && <Banner jenis="gagal">{state.error}</Banner>}
          <EditorUsulan venues={venues} format={format} errors={state.fieldErrors} labelPesan="Pesan" />
          <TombolKirim size="b" className="w-full">Kirim Tawaran</TombolKirim>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function TarikAjakan({ matchId, terbuka }: { matchId: string; terbuka: boolean }) {
  const { pending, jalankan } = useAksi()
  const [buka, setBuka] = useState(false)
  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger asChild>
        <Button variant="teks" className="text-merah">{terbuka ? "Tutup Match Terbuka" : "Tarik Tantangan"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{terbuka ? "Tutup match terbuka ini?" : "Tarik tantangan ini?"}</DialogTitle>
          <DialogDescription>Belum ada kesepakatan, jadi tidak ada penalti keandalan. {terbuka ? "Match hilang dari daftar Cari Lawan." : "Club lawan diberi tahu."}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="bahaya" loading={pending} onClick={() => jalankan(() => tarikAction(matchId), terbuka ? "Match terbuka ditutup" : "Tantangan ditarik", () => setBuka(false))}>
            {terbuka ? "Ya, Tutup" : "Ya, Tarik"}
          </Button>
          <DialogClose asChild>
            <Button variant="garis">Jangan</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AksiDraf({ matchId }: { matchId: string }) {
  const { pending, jalankan } = useAksi()
  return (
    <div className="flex flex-wrap justify-end gap-3">
      <form action={hapusDrafAction.bind(null, matchId)}>
        <Button variant="teks" className="text-merah">Hapus Draf</Button>
      </form>
      <Button loading={pending} onClick={() => jalankan(() => terbitkanDrafAction(matchId), "Match terbuka diterbitkan")}>
        Terbitkan
      </Button>
    </div>
  )
}

// ── Kesiapan (R-01..R-03) ───────────────────────────────────────────────────

export function PanelKesiapan({ matchId, format, jumlah, manual, siap, punyaSkuad, terkunci }: { matchId: string; format: Format; jumlah: number; manual: boolean; siap: boolean; punyaSkuad: boolean; terkunci: boolean }) {
  const min = MIN_PEMAIN[format]
  const [angka, setAngka] = useState(jumlah)
  const { pending, jalankan } = useAksi()
  const ikutRsvp = punyaSkuad && !manual

  if (terkunci) {
    return (
      <Banner jenis={siap ? "saran" : "tindakan"} judul={siap ? `Siap main · ${jumlah} pemain` : `Belum siap · ${jumlah} pemain`}>
        Kesiapan terkunci 2 jam sebelum kick-off. {siap ? "" : "Koordinasikan dengan lawan lewat chat."}
      </Banner>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-bold">Jumlah pemain siap</span>
          <span className="text-xs text-teks-2">{ikutRsvp ? "Dihitung dari konfirmasi Ikut skuad." : "Diisi manual."} Minimal {min}.</span>
        </div>
        {punyaSkuad && (
          <label className="flex items-center gap-2 text-[13px] font-bold">
            Ikuti RSVP
            <Switch checked={ikutRsvp} disabled={pending} onCheckedChange={(on) => jalankan(() => kesiapanAction(matchId, { jumlah: on ? null : jumlah }), on ? "Jumlah mengikuti RSVP" : "Jumlah diisi manual")} />
          </label>
        )}
      </div>
      <div role="group" aria-label="Jumlah pemain siap" className="flex items-center gap-3.5">
        <Button variant="garis" size="ikon" aria-label="Kurangi" disabled={ikutRsvp || angka <= 0} onClick={() => setAngka((a) => a - 1)}>
          <MinusIcon />
        </Button>
        <span className="flex min-w-[72px] flex-col items-center">
          <span className={cn("text-[32px] leading-none font-extrabold", (ikutRsvp ? jumlah : angka) < min ? "text-merah" : "text-hijau")}>{ikutRsvp ? jumlah : angka}</span>
          <span className="text-xs font-bold text-teks-2">pemain</span>
        </span>
        <Button size="ikon" aria-label="Tambah" disabled={ikutRsvp || angka >= 40} onClick={() => setAngka((a) => a + 1)}>
          <PlusIcon />
        </Button>
        {!ikutRsvp && angka !== jumlah && (
          <Button variant="garis" size="k" loading={pending} onClick={() => jalankan(() => kesiapanAction(matchId, { jumlah: angka }), "Jumlah pemain disimpan")}>
            Simpan
          </Button>
        )}
      </div>
      <div className="flex flex-col items-start gap-1.5">
        {siap ? (
          <Button variant="garis" loading={pending} onClick={() => jalankan(() => kesiapanAction(matchId, { siap: false }), "Ditandai belum siap")}>
            Tandai Belum Siap
          </Button>
        ) : (
          <Button variant="emas" disabled={jumlah < min} loading={pending} onClick={() => jalankan(() => kesiapanAction(matchId, { siap: true }), "Club ditandai siap main")}>
            <CheckIcon aria-hidden />
            Tandai Siap
          </Button>
        )}
        {!siap && jumlah < min && <span className="text-[13px] text-teks-2">Lengkapi {min - jumlah} pemain lagi dulu.</span>}
      </div>
    </div>
  )
}

// ── Perubahan jadwal / lapangan / penundaan (S-04, S-06) ───────────────────

function SheetPerubahan({ matchId, jenis, judul, ikon, venues, format, maxHari }: { matchId: string; jenis: "jadwal" | "lapangan" | "tunda"; judul: string; ikon: ReactNode; venues: VenueOpsi[]; format: Format; maxHari?: number }) {
  const [buka, setBuka] = useState(false)
  const router = useRouter()
  const [state, action] = useActionState(async (p: FormState, fd: FormData) => {
    const r = await ajukanPerubahanAction(matchId, jenis, p, fd)
    if (r.ok) {
      setBuka(false)
      toast.berhasil("Usulan terkirim ke lawan")
      router.refresh()
    }
    return r
  }, {} as FormState)
  return (
    <Sheet open={buka} onOpenChange={setBuka}>
      <SheetTrigger asChild>
        <Button variant="garis" size="k">
          {ikon}
          {judul}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{judul}</SheetTitle>
          <SheetDescription>Perubahan baru sah setelah disetujui club lawan. Riwayatnya tercatat.{maxHari ? ` Jadwal baru maksimal ${maxHari} hari lagi.` : ""}</SheetDescription>
        </SheetHeader>
        <form action={action} noValidate className="flex flex-col gap-4">
          {state.error && <Banner jenis="gagal">{state.error}</Banner>}
          {jenis === "tunda" ? (
            <>
              <Field id="alasan-tunda" label="Alasan penundaan" error={state.fieldErrors?.alasan}>
                <Textarea id="alasan-tunda" name="alasan" maxLength={300} className="min-h-20" placeholder="mis. Hujan deras, lapangan tergenang" />
              </Field>
              <Field id="bukti-tunda" label="Bukti singkat" opsional hint="Tautan foto/video (mis. Google Drive). Tidak ada unggah file.">
                <Input id="bukti-tunda" name="bukti" type="url" inputMode="url" maxLength={300} placeholder="https://" />
              </Field>
            </>
          ) : (
            <EditorUsulan venues={venues} format={format} errors={state.fieldErrors} maksOpsi={1} minHari={0} tampilBiaya={false} tampilLapangan={jenis === "lapangan"} />
          )}
          <TombolKirim size="b" className="w-full">Kirim Usulan</TombolKirim>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function AjukanPerubahan({ matchId, venues, format, ditunda }: { matchId: string; venues: VenueOpsi[]; format: Format; ditunda: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      <SheetPerubahan matchId={matchId} jenis="jadwal" judul={ditunda ? "Usulkan Jadwal Baru" : "Ubah Jadwal"} ikon={<CalendarBlankIcon aria-hidden />} venues={venues} format={format} maxHari={ditunda ? 14 : undefined} />
      {!ditunda && <SheetPerubahan matchId={matchId} jenis="lapangan" judul="Ubah Lapangan" ikon={<MapPinIcon aria-hidden />} venues={venues} format={format} />}
      {!ditunda && <SheetPerubahan matchId={matchId} jenis="tunda" judul="Tunda" ikon={<PauseIcon aria-hidden />} venues={venues} format={format} />}
    </div>
  )
}

export function PutuskanPerubahan({ matchId, requestId }: { matchId: string; requestId: string }) {
  const { pending, jalankan } = useAksi()
  return (
    <div className="flex justify-end gap-3">
      <Button variant="teks" size="k" className="text-merah" disabled={pending} onClick={() => jalankan(() => putuskanPerubahanAction(matchId, requestId, false), "Usulan ditolak")}>
        Tolak
      </Button>
      <Button size="k" loading={pending} onClick={() => jalankan(() => putuskanPerubahanAction(matchId, requestId, true), "Usulan disetujui")}>
        <CheckIcon aria-hidden />
        Setujui
      </Button>
    </div>
  )
}

// ── Pembatalan (S-05) ───────────────────────────────────────────────────────

export function BatalkanMatch({ matchId, lawan, mepet }: { matchId: string; lawan: string; mepet: boolean }) {
  const [buka, setBuka] = useState(false)
  const router = useRouter()
  const [state, action] = useActionState(async (p: FormState, fd: FormData) => {
    const r = await batalkanAction(matchId, p, fd)
    if (r.ok) {
      setBuka(false)
      toast.info(r.message ?? "Match dibatalkan")
      router.refresh()
    }
    return r
  }, {} as FormState)
  const e = state.fieldErrors ?? {}
  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger asChild>
        <Button variant="bahaya">Batalkan Match</Button>
      </DialogTrigger>
      <DialogContent>
        <form action={action} noValidate className="flex flex-col gap-3.5">
          <DialogHeader>
            <DialogTitle>Batalkan sparring?</DialogTitle>
            <DialogDescription>
              {lawan} langsung diberi tahu.{" "}
              {mepet ? <b className="text-merah">Kurang dari 24 jam sebelum kick-off: skor keandalan club kamu turun, kecuali karena cuaca dengan bukti.</b> : "Lebih dari 24 jam sebelum kick-off: tidak ada penalti."}
            </DialogDescription>
          </DialogHeader>
          {state.error && <Banner jenis="gagal">{state.error}</Banner>}
          <Field id="alasan-batal" label="Alasan" error={e.alasan}>
            <Select name="alasan" defaultValue={state.values?.alasan}>
              <SelectTrigger id="alasan-batal" aria-invalid={e.alasan ? true : undefined}>
                <SelectValue placeholder="Pilih alasan" />
              </SelectTrigger>
              <SelectContent>
                {ALASAN_BATAL.filter((a) => a !== "tidak_hadir").map((a) => (
                  <SelectItem key={a} value={a}>{LABEL_ALASAN_BATAL[a]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="catatan-batal" label="Catatan untuk lawan" error={e.catatan}>
            <Textarea id="catatan-batal" name="catatan" defaultValue={state.values?.catatan} maxLength={300} className="min-h-20" />
          </Field>
          <Field id="bukti-batal" label="Bukti (untuk cuaca)" opsional hint="Tautan foto/video kondisi lapangan.">
            <Input id="bukti-batal" name="bukti" type="url" inputMode="url" defaultValue={state.values?.bukti} maxLength={300} placeholder="https://" />
          </Field>
          <DialogFooter>
            <TombolKirim variant="bahaya">Ya, Batalkan Match</TombolKirim>
            <DialogClose asChild>
              <Button variant="garis" type="button">Jangan, Tetap Main</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
