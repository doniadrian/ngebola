"use client"

import { useActionState, useState, useSyncExternalStore } from "react"
import { BellRingingIcon, BellSlashIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/sonner"
import { Switch } from "@/components/ui/switch"
import type { FormState } from "@/lib/form-state"
import { simpanPreferensiAction } from "@/server/actions/notifikasi"
import { TombolKirim } from "./tombol-kirim"
import { Banner } from "./umpan-balik"

const keUint8 = (b64: string) => {
  const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

type Dukungan = "memuat" | "tidak-didukung" | "ditolak" | "ok"
const tanpaLangganan = () => () => {}
const bacaDukungan = (): Dukungan =>
  !("serviceWorker" in navigator && "PushManager" in window && "Notification" in window) ? "tidak-didukung" : Notification.permission === "denied" ? "ditolak" : "ok"

/** Aktifkan Web Push di perangkat ini (sukarela, terikat sesi). iPhone: buka dari Layar Utama dulu. */
export function AktifkanPush({ terdaftar }: { terdaftar: boolean }) {
  // Dukungan & izin browser hanya ada di klien; saat render server dianggap "memuat".
  const dukungan = useSyncExternalStore(tanpaLangganan, bacaDukungan, () => "memuat" as const)
  const [aktif, setAktif] = useState(terdaftar)
  const [ditolak, setDitolak] = useState(false)
  const [pending, setPending] = useState(false)
  const k = dukungan !== "ok" ? dukungan : ditolak ? "ditolak" : aktif ? "aktif" : "mati"

  const aktifkan = async () => {
    setPending(true)
    try {
      const izin = await Notification.requestPermission()
      if (izin !== "granted") return setDitolak(true)
      const { publicKey } = (await fetch("/api/push").then((r) => r.json())) as { publicKey: string | null }
      if (!publicKey) return toast.gagal("Web Push belum dikonfigurasi di server.")
      const reg = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keUint8(publicKey) }))
      const r = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) })
      if (!r.ok) throw new Error()
      setAktif(true)
      toast.berhasil("Notifikasi aktif di perangkat ini")
    } catch {
      toast.gagal("Gagal mengaktifkan notifikasi.")
    } finally {
      setPending(false)
    }
  }

  const matikan = async () => {
    setPending(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js")
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) })
        await sub.unsubscribe()
      }
      setAktif(false)
      toast.info("Notifikasi dimatikan di perangkat ini")
    } finally {
      setPending(false)
    }
  }

  if (k === "memuat") return <div className="h-12" aria-busy="true" />
  if (k === "tidak-didukung")
    return <Banner jenis="saran">Browser ini belum mendukung notifikasi push. Di iPhone, tambahkan Ngebola ke Layar Utama lalu buka dari sana.</Banner>
  if (k === "ditolak") return <Banner jenis="tindakan">Izin notifikasi diblokir di browser. Buka pengaturan situs untuk mengizinkannya.</Banner>
  return k === "aktif" ? (
    <Button variant="garis" loading={pending} onClick={matikan}>
      <BellSlashIcon aria-hidden />
      Matikan di Perangkat Ini
    </Button>
  ) : (
    <Button variant="emas" loading={pending} onClick={aktifkan}>
      <BellRingingIcon aria-hidden />
      Aktifkan Notifikasi di Perangkat Ini
    </Button>
  )
}

const JAM = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`)

export function FormPreferensi({ awal }: { awal: { pushEnabled: boolean; quietStart: string | null; quietEnd: string | null; muteReminders: boolean } }) {
  const [state, action] = useActionState(simpanPreferensiAction, {} as FormState)
  const [senyap, setSenyap] = useState(!!awal.quietStart)
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.ok && <Banner jenis="saran">{state.message}</Banner>}
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <label className="flex items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-[15px] font-bold">Kirim notifikasi push</span>
          <span className="text-xs text-teks-2">Notifikasi dalam aplikasi tetap tersimpan.</span>
        </span>
        <Switch name="pushEnabled" defaultChecked={awal.pushEnabled} />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-[15px] font-bold">Bisukan pengingat</span>
          <span className="text-xs text-teks-2">Pengingat 2 jam sebelum kick-off tetap dikirim.</span>
        </span>
        <Switch name="muteReminders" defaultChecked={awal.muteReminders} />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-[15px] font-bold">Jam senyap</span>
          <span className="text-xs text-teks-2">Tanpa push di jam ini (WIB), kecuali sengketa & pengingat 2 jam.</span>
        </span>
        <Switch checked={senyap} onCheckedChange={setSenyap} />
      </label>
      {senyap ? (
        <div className="grid grid-cols-2 gap-3">
          {(["quietStart", "quietEnd"] as const).map((k) => (
            <Select key={k} name={k} defaultValue={(k === "quietStart" ? awal.quietStart : awal.quietEnd) ?? (k === "quietStart" ? "22:00" : "06:00")}>
              <SelectTrigger aria-label={k === "quietStart" ? "Mulai jam senyap" : "Selesai jam senyap"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {JAM.map((j) => (
                  <SelectItem key={j} value={j}>
                    {k === "quietStart" ? "Mulai " : "Sampai "}
                    {j.replace(":", ".")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      ) : (
        <input type="hidden" name="quietStart" value="mati" />
      )}
      <TombolKirim variant="garis" className="self-end">Simpan Preferensi</TombolKirim>
    </form>
  )
}
