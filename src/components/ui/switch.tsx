"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

// Form.html: 56×32, tepi 2px hijau. Mati = krem abu, bulatan krem; hidup = hijau, bulatan emas di kanan.
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-200 border-2 border-hijau bg-nonaktif-bg p-0.5 outline-none after:absolute after:-inset-1.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-hijau data-[state=checked]:bg-hijau disabled:cursor-not-allowed disabled:border-nonaktif-tepi",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-6 rounded-full border-2 border-tinta bg-krem-terang transition-[translate,background-color] duration-300 ease-pegas data-[state=checked]:translate-x-6 data-[state=checked]:bg-emas"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
