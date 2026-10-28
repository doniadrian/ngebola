import { BellIcon, CheckIcon } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"
import { Card, LabelSeksi } from "@/components/ui/card"
import { formatJadwal } from "@/lib/waktu"
import { cn } from "@/lib/utils"
import { tandaiSemuaDibacaAction } from "@/server/actions/notifikasi"
import type { SessionUser } from "@/server/auth/service"
import { daftarNotifikasi, langgananSesi, preferensi } from "@/server/queries/notifikasi"
import { HeaderHalaman } from "./header"
import { AktifkanPush, FormPreferensi } from "./pengaturan-notifikasi"
import { KartuKosong } from "./umpan-balik"

/** Pemberitahuan dalam aplikasi + pengaturan push & jam senyap (PRD 8.4). Sama untuk ketiga peran. */
export function HalamanNotifikasi({ user, kembali }: { user: SessionUser; kembali: string }) {
  const daftar = daftarNotifikasi(user.id)
  const belum = daftar.filter((n) => !n.readAt).length
  const p = preferensi(user.id)
  return (
    <>
      <HeaderHalaman
        judul="Pemberitahuan"
        kembali={kembali}
        aksi={
          belum > 0 ? (
            <form action={tandaiSemuaDibacaAction}>
              <Button variant="teks" size="k" className="min-w-0 gap-1.5 px-2">
                <CheckIcon weight="bold" aria-hidden />
                Tandai <span className="sr-only md:not-sr-only">semua </span>dibaca
              </Button>
            </form>
          ) : null
        }
      />
      {daftar.length ? (
        <ul className="flex flex-col gap-2">
          {daftar.map((n) => (
            <li key={n.id}>
              {/* <a> biasa (bukan Link) agar tidak di-prefetch: membuka = menandai dibaca. */}
              <a
                href={`/buka/${n.id}`}
                className={cn(
                  "flex items-start gap-3 rounded-besar border-2 px-4 py-3 outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-hijau",
                  n.readAt ? "border-nonaktif-tepi bg-transparent" : "border-hijau bg-krem-terang shadow-keras-sm",
                )}
              >
                <span aria-hidden className={cn("mt-1 size-2.5 shrink-0 rounded-full border-[1.5px]", n.readAt ? "border-nonaktif-tepi" : "border-tinta bg-merah")} />
                {!n.readAt && <span className="sr-only">Belum dibaca:</span>}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn("text-[15px]", n.readAt ? "font-semibold" : "font-extrabold")}>{n.title}</span>
                  {n.body && <span className="text-[13px] text-teks-2">{n.body}</span>}
                  <span className="text-xs text-teks-2">{formatJadwal(n.createdAt)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <KartuKosong judul="Belum ada pemberitahuan">Kabar terbaru soal match dan club akan muncul di sini.</KartuKosong>
      )}
      <Card>
        <LabelSeksi className="flex items-center gap-2">
          <BellIcon weight="bold" className="size-4" aria-hidden />
          Notifikasi push
        </LabelSeksi>
        <p className="text-sm text-teks-2">Push bersifat sukarela per perangkat dan berhenti otomatis saat kamu keluar. Isinya singkat; detail tetap di aplikasi.</p>
        <AktifkanPush terdaftar={langgananSesi(user.sessionId)} />
        <FormPreferensi awal={p} />
      </Card>
    </>
  )
}
