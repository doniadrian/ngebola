import type { ReactNode } from "react"
import { LABEL_POSISI } from "@/db/enums"
import type { anggotaSkuad } from "@/server/queries/club"
import { AvatarPemain } from "./avatar-pemain"

type Anggota = ReturnType<typeof anggotaSkuad>[number]

/** Daftar anggota skuad (Kartu.html "Daftar anggota", tanpa status iuran). Hanya untuk yang berhak melihat. */
export function DaftarAnggota({ anggota, jersey, aksi, kosong }: { anggota: Anggota[]; jersey: string; aksi?: (a: Anggota) => ReactNode; kosong: string }) {
  if (!anggota.length) return <p className="rounded-kartu border-2 border-dashed border-nonaktif-tepi px-4 py-5 text-center text-sm text-teks-2">{kosong}</p>
  return (
    <ul className="flex flex-col divide-y-2 divide-dashed divide-nonaktif-tepi rounded-kartu border-2 border-hijau bg-krem-terang px-4">
      {anggota.map((a) => (
        <li key={a.membershipId} className="flex items-center gap-3 py-3">
          <AvatarPemain seed={a.avatarSeed} nama={a.name} foto={a.photoPath} jersey={jersey} ukuran={44} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-extrabold">{a.name}</span>
            <span className="truncate text-xs text-teks-2">{[a.position ? LABEL_POSISI[a.position] : "Posisi belum diisi", a.area].filter(Boolean).join(" · ")}</span>
          </div>
          {aksi?.(a)}
        </li>
      ))}
    </ul>
  )
}
