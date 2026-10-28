"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { kolomIsian } from "./input"

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

// Form.html "Lapangan": pemicu setinggi kolom isian, daftar pilihan = papan krem dengan bayangan 6px.
function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        kolomIsian,
        "flex h-[52px] items-center justify-between gap-2.5 px-3.5 text-left font-bold data-[placeholder]:font-normal data-[placeholder]:text-placeholder data-[state=open]:bg-white data-[state=open]:ring-4 data-[state=open]:ring-emas/60 [&>span]:line-clamp-1",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <CaretDownIcon weight="bold" className="size-5 shrink-0 text-hijau" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-popover border-2 border-hijau bg-krem-terang text-tinta shadow-keras-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          position === "popper" && "w-full min-w-(--radix-select-trigger-width) data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="flex flex-col gap-0.5 p-1.5">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn("px-3 pt-2 pb-1 text-[11px] font-extrabold tracking-widest text-emas-tua uppercase", className)} {...props} />
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-kecil py-2 pr-9 pl-3 text-[15px] font-bold outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:text-placeholder data-[highlighted]:bg-krem data-[state=checked]:bg-bg-saran",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-3 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon weight="bold" className="size-4 text-hijau" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("mx-2 my-1 border-t-[1.5px] border-dashed border-nonaktif-tepi", className)} {...props} />
}

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue }
