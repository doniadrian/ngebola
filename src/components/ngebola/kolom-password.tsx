"use client"

import { useState, type ComponentProps } from "react"
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Kolom password dengan tombol tampil/sembunyi (PRD 4.1): awalnya tersembunyi, tombolnya type="button"
 * sehingga tidak mengirim form dan tidak menghapus isi, dan bisa dipakai dengan keyboard.
 */
export function KolomPassword({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [tampil, setTampil] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={tampil ? "text" : "password"} className={cn("pr-14", className)} />
      <button
        type="button"
        onClick={() => setTampil((v) => !v)}
        aria-pressed={tampil}
        aria-label={tampil ? "Sembunyikan password" : "Tampilkan password"}
        aria-controls={props.id}
        className="absolute top-1/2 right-1.5 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-kecil text-hijau outline-none hover:bg-hijau/8 focus-visible:outline-3 focus-visible:outline-hijau"
      >
        {tampil ? <EyeSlashIcon weight="bold" className="size-5" /> : <EyeIcon weight="bold" className="size-5" />}
      </button>
    </div>
  )
}
