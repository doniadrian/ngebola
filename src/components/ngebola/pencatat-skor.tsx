"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { FlagCheckeredIcon, MinusIcon, PauseIcon, PlayIcon, PlusIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { langkah, type EventSkor, type KeadaanSkor } from "@/server/domain/skor"
import { cn } from "@/lib/utils"
import { Banner } from "./umpan-balik"

type Entri = { clientEntryId: string; half: number; creatorScore: number; opponentScore: number; event: EventSkor; recordedAt: string }
type Sisi = { name: string }

const kunci = (matchId: string) => `ngebola-skor-${matchId}`
const mentah = (matchId: string) => {
  try {
    return localStorage.getItem(kunci(matchId)) ?? "[]"
  } catch {
    return "[]"
  }
}
const urai = (s: string): Entri[] => {
  try {
    return JSON.parse(s)
  } catch {
    return []
  }
}
const baca = (matchId: string) => urai(mentah(matchId))

// Antrean catatan disimpan di localStorage; komponen berlangganan lewat useSyncExternalStore.
const pendengar = new Set<() => void>()
const dengarAntre = (cb: () => void) => {
  pendengar.add(cb)
  window.addEventListener("storage", cb)
  return () => {
    pendengar.delete(cb)
    window.removeEventListener("storage", cb)
  }
}
const simpan = (matchId: string, antre: Entri[]) => {
  try {
    localStorage.setItem(kunci(matchId), JSON.stringify(antre))
  } catch {}
  pendengar.forEach((f) => f())
}
const dengarOnline = (cb: () => void) => {
  window.addEventListener("online", cb)
  window.addEventListener("offline", cb)
  return () => {
    window.removeEventListener("online", cb)
    window.removeEventListener("offline", cb)
  }
}

const terapkan = (k: KeadaanSkor, antre: Entri[]) =>
  antre.reduce((s, e) => langkah(s, { ...e, recordedAt: new Date(e.recordedAt) }) ?? s, k)

/**
 * Pencatat skor (D-02, D-03, W-04). Setiap ketukan disimpan dulu di perangkat lalu dikirim; bila sinyal hilang,
 * antrean dikirim otomatis saat online lagi. Server menerima ulang tanpa menggandakan (clientEntryId).
 */
export function PencatatSkor({ matchId, awal, pembuat, lawan }: { matchId: string; awal: KeadaanSkor; pembuat: Sisi; lawan: Sisi }) {
  const router = useRouter()
  const [server, setServer] = useState(awal)
  const antreMentah = useSyncExternalStore(dengarAntre, () => mentah(matchId), () => "[]")
  const antre = useMemo(() => urai(antreMentah), [antreMentah])
  const jaringan = useSyncExternalStore(dengarOnline, () => navigator.onLine, () => true)
  const [gagal, setGagal] = useState(false)
  const online = jaringan && !gagal
  const mengirim = useRef(false)
  const k = terapkan(server, antre)

  const kirim = useCallback(async () => {
    const q = baca(matchId)
    if (!q.length || mengirim.current) return
    mengirim.current = true
    try {
      const r = await fetch(`/api/match/${matchId}/skor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entri: q }) })
      if (r.ok) {
        const data = (await r.json()) as { keadaan: KeadaanSkor; status: string }
        simpan(matchId, baca(matchId).filter((e) => !q.some((x) => x.clientEntryId === e.clientEntryId)))
        setServer(data.keadaan)
        setGagal(false)
        if (data.status !== "berlangsung") router.refresh()
      } else if (r.status === 409) {
        // Ditolak permanen (mis. bukan pencatat lagi): buang antrean agar tidak macet.
        simpan(matchId, [])
        router.refresh()
      }
    } catch {
      setGagal(true)
    } finally {
      mengirim.current = false
    }
  }, [matchId, router])

  useEffect(() => {
    const t = setInterval(kirim, 5000)
    const on = () => void kirim()
    window.addEventListener("online", on)
    return () => {
      clearInterval(t)
      window.removeEventListener("online", on)
    }
  }, [kirim])

  const catat = (event: EventSkor, skor: [number, number], half: number) => {
    const e: Entri = { clientEntryId: crypto.randomUUID(), half, creatorScore: skor[0], opponentScore: skor[1], event, recordedAt: new Date().toISOString() }
    if (!langkah(k, { ...e, recordedAt: new Date(e.recordedAt) })) return
    simpan(matchId, [...baca(matchId), e])
    void kirim()
  }

  const ubah = (sisi: 0 | 1, d: 1 | -1) => {
    const s: [number, number] = [...k.skor]
    s[sisi] = Math.max(0, s[sisi] + d)
    catat("skor", s, k.babak)
  }

  const bermain = k.fase === "babak1" || k.fase === "babak2"
  return (
    <div className="flex flex-col gap-4">
      {!online && <Banner jenis="koneksi">Sinyal hilang. Perubahan disimpan & dikirim saat online lagi.</Banner>}
      <p className="text-center text-[13px] font-extrabold tracking-[.1em] text-emas-tua uppercase">
        {k.fase === "babak1" ? "Babak 1" : k.fase === "jeda" ? "Jeda" : k.fase === "babak2" ? "Babak 2" : k.fase === "selesai" ? "Peluit akhir" : "Belum mulai"}
        {k.skorBabak1 && k.fase !== "babak1" ? ` · babak 1: ${k.skorBabak1[0]}–${k.skorBabak1[1]}` : ""}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {([pembuat, lawan] as const).map((c, i) => (
          <div key={c.name} className="flex flex-col items-center gap-3 rounded-kartu border-2 border-hijau bg-krem p-4">
            <span className="line-clamp-2 text-center text-sm font-extrabold">{c.name}</span>
            <span className="text-[56px] leading-none font-extrabold tabular-nums text-hijau" aria-live="polite" aria-label={`Skor ${c.name}: ${k.skor[i]}`}>
              {k.skor[i]}
            </span>
            <Button variant="emas" size="b" className="w-full" disabled={!bermain} onClick={() => ubah(i as 0 | 1, 1)} aria-label={`Gol untuk ${c.name}`}>
              <PlusIcon aria-hidden />
              Gol
            </Button>
            <Button variant="teks" size="k" disabled={!bermain || k.skor[i] === 0} onClick={() => ubah(i as 0 | 1, -1)} aria-label={`Koreksi, kurangi gol ${c.name}`}>
              <MinusIcon aria-hidden />
              Koreksi
            </Button>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        {k.fase === "babak1" && (
          <Button variant="garis" onClick={() => catat("akhir_babak", k.skor, 1)}>
            <PauseIcon aria-hidden />
            Akhiri Babak 1
          </Button>
        )}
        {k.fase === "jeda" && (
          <Button onClick={() => catat("mulai", k.skor, 2)}>
            <PlayIcon aria-hidden />
            Mulai Babak 2
          </Button>
        )}
        {k.fase === "babak2" && <PeluitAkhir skor={k.skor} pembuat={pembuat.name} lawan={lawan.name} onYa={() => catat("selesai", k.skor, 2)} />}
      </div>
      <p className={cn("text-center text-xs text-teks-2")} aria-live="polite">
        {antre.length > 0 ? `Menyinkronkan ${antre.length} catatan…` : "Kamu pencatat aktif. Club lawan melihat skor ini secara langsung."}
      </p>
    </div>
  )
}

function PeluitAkhir({ skor, pembuat, lawan, onYa }: { skor: [number, number]; pembuat: string; lawan: string; onYa: () => void }) {
  const [buka, setBuka] = useState(false)
  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger asChild>
        <Button>
          <FlagCheckeredIcon aria-hidden />
          Peluit Akhir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tiup peluit akhir?</DialogTitle>
          <DialogDescription>
            Skor akhir <b className="text-tinta">{pembuat} {skor[0]}–{skor[1]} {lawan}</b> dikirim ke {lawan === pembuat ? "lawan" : "club lawan"} untuk dikonfirmasi dalam 48 jam. Pencatatan ditutup.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => {
              setBuka(false)
              onYa()
            }}
          >
            Ya, Selesai
          </Button>
          <DialogClose asChild>
            <Button variant="garis">Belum</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Tampilan skor langsung untuk club lawan (pencatat lain bisa melihat, D-02). */
export function LihatSkor({ matchId, awal, pembuat, lawan }: { matchId: string; awal: KeadaanSkor; pembuat: Sisi; lawan: Sisi }) {
  const [k, setK] = useState(awal)
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.visibilityState !== "visible") return
      const r = await fetch(`/api/match/${matchId}/skor`, { cache: "no-store" }).catch(() => null)
      if (!r?.ok) return
      const d = (await r.json()) as { keadaan: KeadaanSkor; status: string }
      setK(d.keadaan)
      if (d.status !== "berlangsung") router.refresh()
    }, 5000)
    return () => clearInterval(t)
  }, [matchId, router])
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-[13px] font-extrabold tracking-[.1em] text-emas-tua uppercase">{k.fase === "jeda" ? "Jeda" : k.fase === "babak2" ? "Babak 2" : "Babak 1"} · langsung</p>
      <div className="flex items-center justify-center gap-5" aria-live="polite">
        <span className="max-w-[35%] text-right text-sm font-extrabold">{pembuat.name}</span>
        <span className="text-[44px] font-extrabold tabular-nums text-hijau">
          {k.skor[0]}–{k.skor[1]}
        </span>
        <span className="max-w-[35%] text-sm font-extrabold">{lawan.name}</span>
      </div>
    </div>
  )
}
