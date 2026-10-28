"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-2.5", className)} {...props} />
}

// Form.html: bulatan 22, tepi 2px hijau, titik hijau 10.
function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer inline-flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 border-hijau bg-krem-terang transition-colors duration-150 outline-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-hijau aria-invalid:border-merah disabled:cursor-not-allowed disabled:border-nonaktif-tepi disabled:bg-nonaktif-bg",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className="size-2.5 animate-pop rounded-full bg-hijau" />
    </RadioGroupPrimitive.Item>
  )
}

/**
 * Pilihan berbentuk kartu (Form.html "Sewa lapangan dibayar"): terpilih = tepi hijau + bayangan 3px,
 * belum terpilih = tepi krem abu.
 */
function RadioCard({
  value,
  id,
  judul,
  keterangan,
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & { judul: string; keterangan?: string }) {
  const itemId = id ?? `radio-${value}`
  return (
    <label
      htmlFor={itemId}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-tombol border-2 border-nonaktif-tepi bg-transparent px-3.5 py-3 transition-[border-color,box-shadow] has-[[data-state=checked]]:border-hijau has-[[data-state=checked]]:bg-krem-terang has-[[data-state=checked]]:shadow-keras-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-hijau has-[[aria-invalid=true]]:border-merah",
        className
      )}
    >
      <RadioGroupItem value={value} id={itemId} className="focus-visible:outline-none" {...props} />
      <span className="flex flex-col">
        <span className="text-[15px] font-extrabold">{judul}</span>
        {keterangan && <span className="text-xs text-teks-2">{keterangan}</span>}
      </span>
    </label>
  )
}

export { RadioGroup, RadioGroupItem, RadioCard }
