"use client"

import { useActionState } from "react"
import Image from "next/image"
import { TrashIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/form-state"
import { hapusFotoAction, tambahFotoAction } from "@/server/actions/club"
import { TombolKirim } from "./tombol-kirim"
import { UnggahGambar } from "./unggah-gambar"
import { Banner } from "./umpan-balik"

export function GaleriKelola({ foto, maks }: { foto: { id: string; path: string }[]; maks: number }) {
  const [state, action] = useActionState(tambahFotoAction, {} as FormState)
  const penuh = foto.length >= maks
  return (
    <div className="flex flex-col gap-4">
      {foto.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {foto.map((f) => (
            <li key={f.id} className="relative overflow-hidden rounded-besar border-2 border-hijau bg-krem">
              <Image src={f.path} alt="Foto galeri club" width={400} height={300} className="aspect-[4/3] w-full object-cover" unoptimized />
              <form action={hapusFotoAction.bind(null, f.id)} className="absolute top-2 right-2">
                <Button variant="garis" size="ikon" aria-label="Hapus foto ini">
                  <TrashIcon weight="bold" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[13px] text-teks-2">
        {foto.length} dari {maks} foto.
      </p>
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      {!penuh && (
        <form action={action} data-boleh-reset className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <UnggahGambar id="foto" name="foto" judul="Tambah foto" keterangan="PNG/JPG/WebP, maks 2 MB." />
          </div>
          <TombolKirim variant="garis">Unggah Foto</TombolKirim>
        </form>
      )}
    </div>
  )
}
