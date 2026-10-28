import { LABEL_FORMAT } from "@/db/enums"
import type { BarisMatch } from "@/server/queries/match"
import { BarisJadwal, ringkasJadwal } from "./match-ui"

/** Daftar match dari sudut pandang satu club. */
export function DaftarMatchClub({ items, clubId, tanggal, kosong, perluSetuju, dasar = "/club/match" }: { items: BarisMatch[]; clubId: string; tanggal?: Map<string, Date>; kosong: string; perluSetuju?: Set<string>; dasar?: string }) {
  if (!items.length) return <p className="rounded-kartu border-2 border-dashed border-nonaktif-tepi px-4 py-6 text-center text-sm text-teks-2">{kosong}</p>
  return (
    <ul className="flex flex-col gap-3">
      {items.map(({ match: m, pembuat, lawan, venue }) => {
        const musuh = m.creatorClubId === clubId ? lawan : pembuat
        const at = m.scheduledAt ?? tanggal?.get(m.id) ?? null
        const skor = m.finalCreatorScore != null ? (m.creatorClubId === clubId ? `${m.finalCreatorScore}–${m.finalOpponentScore}` : `${m.finalOpponentScore}–${m.finalCreatorScore}`) : null
        return (
          <BarisJadwal
            key={m.id}
            href={`${dasar}/${m.id}`}
            at={at}
            lawan={musuh ? `vs ${musuh.name}` : "Match terbuka · mencari lawan"}
            sub={`${LABEL_FORMAT[m.format]} · ${ringkasJadwal(at, venue?.name ?? m.manualVenueName)}`}
            status={m.status}
            tambahan={
              <>
                {skor && <span className="text-sm font-extrabold tabular-nums text-hijau">{skor}</span>}
                {perluSetuju?.has(m.id) && <span className="text-xs font-bold text-emas-tua">Usulan perubahan menunggu kamu</span>}
              </>
            }
          />
        )
      })}
    </ul>
  )
}
