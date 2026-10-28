"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

// Form.html: kotak 24, sudut 7, tepi 2px hijau; tercentang = isi hijau + centang emas.
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative inline-flex size-6 shrink-0 items-center justify-center rounded-badge border-2 border-hijau bg-krem-terang text-emas transition-colors duration-150 outline-none after:absolute after:-inset-2.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-hijau aria-invalid:border-merah data-[state=checked]:bg-hijau disabled:cursor-not-allowed disabled:border-nonaktif-tepi disabled:bg-nonaktif-bg",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-content-center animate-pop">
        <CheckIcon weight="bold" className="size-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
