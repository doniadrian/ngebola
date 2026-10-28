import * as React from "react"
import { cn } from "@/lib/utils"

// Form.html: tinggi 52, tepi 2px hijau, TANPA bayangan keras. Fokus = latar putih + halo emas.
export const kolomIsian =
  "w-full min-w-0 rounded-tombol border-2 border-hijau bg-krem-terang text-base text-tinta outline-none transition-[background-color,box-shadow] placeholder:text-placeholder focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emas/60 aria-invalid:border-merah aria-invalid:bg-bg-error disabled:cursor-not-allowed disabled:border-nonaktif-tepi disabled:bg-nonaktif-bg disabled:text-placeholder"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(kolomIsian, "h-[52px] px-4 [&:not(:placeholder-shown)]:font-semibold", className)}
      {...props}
    />
  )
}

export { Input }
