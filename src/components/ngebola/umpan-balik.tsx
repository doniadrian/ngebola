import type { ReactNode } from "react"
import Image from "next/image"
import { InfoIcon, WarningIcon, WifiSlashIcon } from "@phosphor-icons/react/ssr"
import { cn } from "@/lib/utils"

// Umpan-Balik.html "Banner": tinggal di halaman sampai masalahnya beres.
// Kuning (kartu kuning) = perlu tindakan, hijau muda = saran, tinta = status koneksi.
export function Banner({
  jenis = "saran",
  judul,
  children,
  aksi,
  className,
}: {
  jenis?: "tindakan" | "saran" | "koneksi" | "gagal"
  judul?: ReactNode
  children?: ReactNode
  aksi?: ReactNode
  className?: string
}) {
  if (jenis === "koneksi") {
    return (
      <div role="status" className={cn("flex items-center gap-3 rounded-tombol bg-tinta px-4 py-2.5 text-krem", className)}>
        <WifiSlashIcon weight="bold" className="size-[18px] shrink-0 text-emas" aria-hidden />
        <span className="flex-1 text-[13px] font-semibold">{children}</span>
      </div>
    )
  }
  const Ikon = jenis === "saran" ? InfoIcon : WarningIcon
  return (
    <div
      role={jenis === "gagal" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3.5 rounded-popover border-2 p-4",
        jenis === "tindakan" && "border-tinta bg-bg-menunggu",
        jenis === "saran" && "border-hijau bg-bg-saran",
        jenis === "gagal" && "border-merah bg-bg-error",
        className
      )}
    >
      <Ikon weight="bold" className={cn("mt-0.5 size-5 shrink-0", jenis === "gagal" ? "text-merah" : "text-hijau")} aria-hidden />
      <div className="flex flex-1 flex-col gap-1">
        {judul && <p className="text-[15px] font-extrabold">{judul}</p>}
        {children && <div className="text-[13px] leading-normal text-teks-2 [&_b]:text-tinta">{children}</div>}
        {aksi && <div className="mt-2 flex flex-wrap gap-3">{aksi}</div>}
      </div>
    </div>
  )
}

// Umpan-Balik.html "Skeleton": meniru bentuk kartu asli, kilau 1,3 detik, berhenti bila gerak dikurangi.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-kilau rounded-md bg-nonaktif-bg bg-[linear-gradient(90deg,var(--color-nonaktif-bg)_0,var(--color-kilau)_50%,var(--color-nonaktif-bg)_100%)] bg-size-[240px_100%] bg-no-repeat",
        className
      )}
    />
  )
}

/** Kerangka kartu saat memuat: tepi abu (belum bisa diklik). */
export function KartuMemuat({ label = "Memuat", baris = 3 }: { label?: string; baris?: number }) {
  return (
    <div aria-busy="true" aria-label={label} className="flex flex-col gap-4 rounded-kartu border-2 border-nonaktif-tepi bg-krem-terang p-5">
      <Skeleton className="h-[26px] w-[120px] rounded-badge" />
      <div className="flex items-center justify-around rounded-besar bg-krem py-4">
        <Skeleton className="h-[60px] w-[52px] rounded-[14px_14px_26px_26px]" />
        <Skeleton className="h-5 w-[30px]" />
        <Skeleton className="h-[60px] w-[52px] rounded-[14px_14px_26px_26px]" />
      </div>
      {Array.from({ length: baris }, (_, i) => (
        <Skeleton key={i} className={cn("h-3.5", ["w-4/5", "w-2/3", "w-3/4"][i % 3])} />
      ))}
    </div>
  )
}

// Kartu.html "Kartu kosong": pakai maskot Pak Bola.
export function KartuKosong({ judul, children, aksi, className }: { judul: string; children?: ReactNode; aksi?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-kartu border-2 border-hijau bg-krem-terang p-6 text-center", className)}>
      <Image src="/brand/pakbola-maskot-terang.svg" alt="" width={120} height={120} className="h-[120px] w-auto" />
      <h3 className="text-lg font-extrabold text-hijau">{judul}</h3>
      {children && <p className="max-w-sm text-sm leading-normal text-teks-2">{children}</p>}
      {aksi && <div className="mt-1">{aksi}</div>}
    </div>
  )
}
