import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

// Lambang.html "Badge status": kotak sudut 7, kapital 11px, tepi tinta 1.5px + bayangan 2px.
const badgeVariants = cva(
  "inline-flex h-7 w-fit shrink-0 items-center gap-1.5 rounded-badge border-[1.5px] border-tinta pr-2.5 pl-2 text-[11px] font-extrabold tracking-[.06em] whitespace-nowrap uppercase shadow-keras-xs shadow-tinta [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        menunggu: "bg-bg-menunggu text-tinta",
        diterima: "bg-hijau text-krem",
        ditolak: "bg-krem-terang text-merah-tekan",
        ditawar: "bg-bg-ditawar text-tinta",
        selesai: "bg-nonaktif-bg text-tinta",
        saran: "bg-bg-saran text-tinta",
        bahaya: "bg-merah text-white",
        netral: "bg-krem-terang text-tinta",
        // Badge info (mis. "Admin"): latar hijau tanpa bayangan.
        info: "bg-hijau text-krem shadow-none",
      },
    },
    defaultVariants: { variant: "netral" },
  }
)

function Badge({ className, variant, asChild = false, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

/** Angka pemberitahuan: merah = perlu ditanggapi, emas = jumlah filter aktif (Navigasi.html). */
function Hitungan({ jumlah, warna = "merah", className, label }: { jumlah: number; warna?: "merah" | "emas"; className?: string; label?: string }) {
  if (jumlah <= 0) return null
  return (
    <span
      aria-label={label ?? `${jumlah} perlu ditanggapi`}
      className={cn(
        "inline-flex h-5 min-w-5 animate-pop items-center justify-center rounded-full border-[1.5px] border-tinta px-[5px] text-[11px] leading-none font-extrabold",
        warna === "merah" ? "bg-merah text-white" : "bg-emas text-tinta",
        className
      )}
    >
      {jumlah > 99 ? "99+" : jumlah}
    </span>
  )
}

/** Titik merah = ada yang baru tapi tidak mendesak. */
function TitikBaru({ className, label = "Ada yang baru" }: { className?: string; label?: string }) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true }
  return <span {...a11y} className={cn("block size-2.5 rounded-full border-[1.5px] border-tinta bg-merah", className)} />
}

export { Badge, badgeVariants, Hitungan, TitikBaru }
