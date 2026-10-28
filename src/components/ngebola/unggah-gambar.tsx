"use client"

import { useEffect, useState } from "react"
import { UploadSimpleIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

const MAKS = 2 * 1024 * 1024

/**
 * Unggah gambar (Form.html "Logo tim"): kotak bertepi putus-putus, pratinjau sebelum dikirim.
 * Ukuran & jenis dicek lagi di server; di sini hanya untuk memberi tahu lebih awal.
 */
export function UnggahGambar({ id, name, judul, keterangan, gambarLama, invalid, describedBy, bulat }: { id: string; name: string; judul: string; keterangan: string; gambarLama?: string | null; invalid?: boolean; describedBy?: string; bulat?: boolean }) {
  const [pratinjau, setPratinjau] = useState<string | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  useEffect(() => () => void (pratinjau && URL.revokeObjectURL(pratinjau)), [pratinjau])
  const gambar = pratinjau ?? gambarLama

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-center gap-4 rounded-popover border-2 border-dashed bg-krem-terang px-4 py-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hijau",
          invalid || galat ? "border-merah bg-bg-error" : "border-hijau",
        )}
      >
        {gambar ? (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau berkas lokal (blob:)
          <img src={gambar} alt="" className={cn("size-16 shrink-0 border-2 border-tinta object-cover", bulat ? "rounded-full" : "rounded-kecil")} />
        ) : (
          <span className={cn("flex size-16 shrink-0 items-center justify-center border-2 border-dashed border-nonaktif-tepi text-hijau", bulat ? "rounded-full" : "rounded-kecil")}>
            <UploadSimpleIcon weight="bold" className="size-7" aria-hidden />
          </span>
        )}
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-extrabold">{gambar ? "Ganti gambar" : judul}</span>
          <span className="text-xs leading-snug text-teks-2">{keterangan}</span>
        </span>
        <input
          id={id}
          name={name}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-describedby={describedBy}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            setGalat(null)
            if (!f) return setPratinjau(null)
            if (f.size > MAKS) {
              setGalat("Ukuran gambar maksimal 2 MB.")
              e.target.value = ""
              return setPratinjau(null)
            }
            setPratinjau(URL.createObjectURL(f))
          }}
        />
      </label>
      {galat && (
        <p role="alert" className="text-[13px] font-bold text-merah">
          {galat}
        </p>
      )}
    </div>
  )
}
