import * as React from "react"
import { cn } from "@/lib/utils"

// Kartu.html: sudut 20, padding 20, tepi 2px hijau. Bisa diklik = + bayangan 4px hijau & efek tekan.
const kartu = "flex flex-col gap-4 rounded-kartu border-2 border-hijau bg-krem-terang p-5 text-tinta"
const kartuInteraktif =
  "shadow-keras transition-[translate,box-shadow] duration-[240ms] ease-pegas tekan:ease-out hover:-translate-y-px hover:shadow-keras-lg tekan:translate-y-1 tekan:shadow-none tekan:duration-60 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-hijau"

function Card({ className, interaktif = false, ...props }: React.ComponentProps<"div"> & { interaktif?: boolean }) {
  return <div data-slot="card" className={cn(kartu, interaktif && kartuInteraktif, className)} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("text-lg leading-tight font-extrabold text-tinta", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-sm leading-normal text-teks-2", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("flex flex-col gap-3", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center gap-3", className)} {...props} />
}

/** Label seksi kecil kapital (mis. "AJAKAN BARU"). */
function LabelSeksi({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-[13px] font-extrabold tracking-[.1em] text-emas-tua uppercase", className)} {...props} />
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, LabelSeksi, kartu, kartuInteraktif }
