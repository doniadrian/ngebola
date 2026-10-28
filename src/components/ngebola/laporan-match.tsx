import { WarningIcon } from "@phosphor-icons/react/ssr"
import { LabelSeksi } from "@/components/ui/card"
import type { matches, scoreEntries } from "@/db/schema"
import { formatJam } from "@/lib/waktu"
import { cn } from "@/lib/utils"
import { keadaanSkor } from "@/server/domain/skor"
import { sudahCheckIn } from "@/server/hari-h"
import { clubDariId } from "@/server/queries/club"
import { db } from "@/db"
import { matchReadiness } from "@/db/schema"
import { eq } from "drizzle-orm"

const LABEL_EVENT = { mulai: "Mulai", skor: "Skor", jeda: "Jeda", akhir_babak: "Akhir babak", selesai: "Peluit akhir" }

/** Laporan match (H-04): skor per babak, check-in, jumlah pemain siap, catatan skor (konflik ditandai). */
export function LaporanMatch({ match: m, catatan }: { match: typeof matches.$inferSelect; catatan: (typeof scoreEntries.$inferSelect)[] }) {
  const k = keadaanSkor(catatan)
  const pembuat = clubDariId(m.creatorClubId)!
  const lawan = clubDariId(m.opponentClubId!)!
  const hadir = sudahCheckIn(m.id)
  const siap = db.select().from(matchReadiness).where(eq(matchReadiness.matchId, m.id)).all()
  const nama = (id: string) => (id === pembuat.id ? pembuat.name : lawan.name)
  return (
    <details className="group rounded-kartu border-2 border-nonaktif-tepi bg-krem-terang">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 outline-none focus-visible:outline-3 focus-visible:outline-hijau">
        <LabelSeksi>Laporan match</LabelSeksi>
        <span className="text-sm font-bold text-hijau group-open:hidden">Lihat</span>
      </summary>
      <div className="flex flex-col gap-4 px-5 pb-5 text-sm">
        <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div>
            <dt className="text-xs text-teks-2">Babak 1</dt>
            <dd className="font-extrabold">{k.skorBabak1 ? `${k.skorBabak1[0]}–${k.skorBabak1[1]}` : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-teks-2">Skor tercatat</dt>
            <dd className="font-extrabold">
              {k.skor[0]}–{k.skor[1]}
            </dd>
          </div>
          {siap.map((s) => (
            <div key={s.clubId}>
              <dt className="text-xs text-teks-2">Pemain siap {nama(s.clubId)}</dt>
              <dd className="font-extrabold">{s.playersReady}</dd>
            </div>
          ))}
        </dl>
        <p className="text-teks-2">Check-in: {hadir.length ? hadir.map((h) => `${nama(h.clubId)} ${formatJam(h.checkedInAt)}${h.lat != null ? " (GPS)" : ""}`).join(" · ") : "—"}</p>
        <ol className="flex flex-col gap-1">
          {catatan.map((c) => (
            <li key={c.id} className={cn("flex items-center gap-2", c.conflict && "text-merah")}>
              <span className="w-12 tabular-nums text-teks-2">{formatJam(c.recordedAt)}</span>
              <span className="font-bold">
                {LABEL_EVENT[c.event]} {c.event !== "mulai" ? `${c.creatorScore}–${c.opponentScore}` : `babak ${c.half}`}
              </span>
              {c.conflict && (
                <span className="flex items-center gap-1 text-xs font-bold">
                  <WarningIcon weight="bold" className="size-3.5" aria-hidden />
                  konflik sinkron
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </details>
  )
}
