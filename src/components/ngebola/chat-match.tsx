"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { FlagIcon, MapPinIcon, PaperPlaneRightIcon, ProhibitIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/sonner"
import { Textarea } from "@/components/ui/textarea"
import { formatJam, formatTanggal } from "@/lib/waktu"
import { cn } from "@/lib/utils"
import { blokirAction, kirimPesanAction, laporkanAction } from "@/server/actions/match"

export type PesanChat = { id: string; kind: "manusia" | "sistem"; body: string; lat: number | null; lng: number | null; hidden: boolean; at: string; senderClubId: string | null; senderClub: string | null }

const JEDA_POLLING = 5000

/** Chat per match antara kedua admin (PRD 8.3). Diperbarui tiap 5 detik selama tab terlihat. */
export function ChatMatch({ matchId, awal, clubSayaId, bisaTulis, lawan, sudahBlokir, hanyaBaca }: { matchId: string; awal: PesanChat[]; clubSayaId?: string; bisaTulis: boolean; lawan?: { id: string; name: string }; sudahBlokir?: boolean; hanyaBaca?: boolean }) {
  const [pesan, setPesan] = useState(awal)
  const [teks, setTeks] = useState("")
  const [pending, start] = useTransition()
  const daftar = useRef<HTMLOListElement>(null)
  const terakhir = pesan.at(-1)?.at

  useEffect(() => {
    const ambil = async () => {
      if (document.visibilityState !== "visible") return
      const r = await fetch(`/api/match/${matchId}/chat${terakhir ? `?setelah=${encodeURIComponent(terakhir)}` : ""}`, { cache: "no-store" }).catch(() => null)
      if (!r?.ok) return
      const data = (await r.json()) as { pesan: PesanChat[] }
      if (data.pesan.length) setPesan((p) => [...p, ...data.pesan.filter((b) => !p.some((x) => x.id === b.id))])
    }
    const t = setInterval(ambil, JEDA_POLLING)
    return () => clearInterval(t)
  }, [matchId, terakhir])

  useEffect(() => {
    daftar.current?.lastElementChild?.scrollIntoView({ block: "nearest" })
  }, [pesan.length])

  const kirim = (input: { body: string; lat?: number; lng?: number }) =>
    start(async () => {
      const r = await kirimPesanAction(matchId, input)
      if (!r.ok) {
        toast.gagal(r.error ?? "Pesan gagal dikirim.")
        return
      }
      setTeks("")
      const baru = await fetch(`/api/match/${matchId}/chat${terakhir ? `?setelah=${encodeURIComponent(terakhir)}` : ""}`, { cache: "no-store" }).then((x) => x.json() as Promise<{ pesan: PesanChat[] }>)
      setPesan((p) => [...p, ...baru.pesan.filter((b) => !p.some((x) => x.id === b.id))])
    })

  const bagikanLokasi = () => {
    if (!navigator.geolocation) return toast.gagal("Perangkat tidak mendukung lokasi.")
    navigator.geolocation.getCurrentPosition(
      (pos) => kirim({ body: "", lat: Number(pos.coords.latitude.toFixed(5)), lng: Number(pos.coords.longitude.toFixed(5)) }),
      () => toast.gagal("Izin lokasi ditolak."),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Chat match">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-extrabold tracking-[.1em] text-emas-tua uppercase">Chat match</h2>
        {lawan && !hanyaBaca && <BlokirClub lawan={lawan} sudah={!!sudahBlokir} />}
      </div>
      <div className="flex flex-col rounded-kartu border-2 border-hijau bg-krem-terang">
        <ol ref={daftar} aria-live="polite" className="flex max-h-[420px] min-h-40 flex-col gap-2.5 overflow-y-auto p-4">
          {pesan.length === 0 && <li className="m-auto text-sm text-teks-2">Belum ada pesan.</li>}
          {pesan.map((p, i) => {
            const at = new Date(p.at)
            const hariBaru = i === 0 || formatTanggal(new Date(pesan[i - 1].at)) !== formatTanggal(at)
            const saya = p.senderClubId && p.senderClubId === clubSayaId
            return (
              <li key={p.id} className="flex flex-col gap-2.5">
                {hariBaru && <span className="self-center text-[11px] font-extrabold tracking-wide text-teks-2 uppercase">{formatTanggal(at)}</span>}
                {p.kind === "sistem" ? (
                  <p className="self-center rounded-kecil bg-krem px-3 py-1.5 text-center text-[13px] text-teks-2">
                    {p.body} <span className="text-[11px]">· {formatJam(at)}</span>
                  </p>
                ) : (
                  <div className={cn("flex max-w-[85%] flex-col gap-1", saya ? "self-end items-end" : "self-start items-start")}>
                    {!saya && <span className="text-[11px] font-bold text-teks-2">{p.senderClub ?? "Admin"}</span>}
                    <div className={cn("rounded-besar border-2 px-3.5 py-2 text-[15px] leading-snug break-words whitespace-pre-wrap", saya ? "border-hijau bg-hijau text-krem" : "border-nonaktif-tepi bg-white", p.hidden && "italic opacity-70")}>
                      {p.body}
                      {p.lat != null && p.lng != null && (
                        <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noreferrer" className={cn("mt-1 flex items-center gap-1 text-sm font-bold underline underline-offset-4", saya ? "text-emas" : "text-hijau")}>
                          <MapPinIcon aria-hidden className="size-4" />
                          Lihat di peta
                        </a>
                      )}
                    </div>
                    <span className="flex items-center gap-2 text-[11px] text-teks-2">
                      {formatJam(at)}
                      {!saya && !p.hidden && !hanyaBaca && <LaporkanPesan pesanId={p.id} />}
                    </span>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        {bisaTulis ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (teks.trim()) kirim({ body: teks })
            }}
            className="flex items-end gap-2 border-t-2 border-nonaktif-tepi p-3"
          >
            <Button type="button" variant="garis" size="ikon" aria-label="Bagikan lokasi saya" onClick={bagikanLokasi} disabled={pending}>
              <MapPinIcon />
            </Button>
            <label className="flex-1">
              <span className="sr-only">Tulis pesan</span>
              <Textarea
                value={teks}
                onChange={(e) => setTeks(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    if (teks.trim()) kirim({ body: teks })
                  }
                }}
                rows={1}
                maxLength={1000}
                placeholder="Tulis pesan…"
                className="min-h-11 py-2.5"
              />
            </label>
            <Button type="submit" size="ikon" aria-label="Kirim pesan" loading={pending} disabled={!teks.trim()}>
              <PaperPlaneRightIcon />
            </Button>
          </form>
        ) : (
          !hanyaBaca && <p className="border-t-2 border-nonaktif-tepi p-3 text-center text-[13px] text-teks-2">Chat ditutup. Riwayat tetap bisa dibaca.</p>
        )}
      </div>
    </section>
  )
}

function LaporkanPesan({ pesanId }: { pesanId: string }) {
  const [buka, setBuka] = useState(false)
  const [alasan, setAlasan] = useState("")
  const [pending, start] = useTransition()
  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger asChild>
        <button type="button" className="flex min-h-6 items-center gap-1 font-bold underline underline-offset-2 outline-none focus-visible:outline-2 focus-visible:outline-hijau">
          <FlagIcon aria-hidden className="size-3" />
          Laporkan
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Laporkan pesan ini?</DialogTitle>
          <DialogDescription>Admin platform akan meninjau. Pengirim tidak tahu siapa yang melapor.</DialogDescription>
        </DialogHeader>
        <label className="flex flex-col gap-2 text-sm font-bold">
          Alasan
          <Textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} maxLength={500} className="min-h-20 font-normal" placeholder="mis. Kata kasar, ancaman" />
        </label>
        <DialogFooter>
          <Button
            variant="bahaya"
            loading={pending}
            disabled={alasan.trim().length < 5}
            onClick={() =>
              start(async () => {
                const r = await laporkanAction("pesan", pesanId, alasan)
                if (r.ok) {
                  setBuka(false)
                  toast.berhasil("Laporan terkirim")
                } else toast.gagal(r.error ?? "Gagal melapor.")
              })
            }
          >
            Kirim Laporan
          </Button>
          <DialogClose asChild>
            <Button variant="garis">Batal</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BlokirClub({ lawan, sudah }: { lawan: { id: string; name: string }; sudah: boolean }) {
  const [buka, setBuka] = useState(false)
  const [pending, start] = useTransition()
  const ubah = (blokir: boolean) =>
    start(async () => {
      const r = await blokirAction(lawan.id, blokir)
      if (r.ok) {
        setBuka(false)
        toast.berhasil(blokir ? `${lawan.name} diblokir` : `Blokir ${lawan.name} dibuka`)
      } else toast.gagal(r.error ?? "Gagal.")
    })
  if (sudah) {
    return (
      <Button variant="teks" size="k" className="px-1" loading={pending} onClick={() => ubah(false)}>
        Buka blokir
      </Button>
    )
  }
  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger asChild>
        <Button variant="teks" size="k" className="px-1 text-merah">
          <ProhibitIcon aria-hidden />
          Blokir club
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Blokir {lawan.name}?</DialogTitle>
          <DialogDescription>Mereka tidak bisa menantang club kamu atau melihat match terbuka club kamu. Match yang sudah disepakati tetap berjalan.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="bahaya" loading={pending} onClick={() => ubah(true)}>
            Ya, Blokir
          </Button>
          <DialogClose asChild>
            <Button variant="garis">Batal</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
