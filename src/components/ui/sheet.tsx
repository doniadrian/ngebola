"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { XIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close

// Umpan-Balik.html "Bottom sheet": tugas singkat tanpa pindah halaman. Sudut atas 26, tepi atas tinta.
function SheetContent({
  className,
  children,
  side = "bottom",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: "bottom" | "right"; showCloseButton?: boolean }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-tinta/60 data-[state=open]:animate-lapis-masuk data-[state=closed]:animate-lapis-keluar" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-krem text-tinta outline-none",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-sheet border-t-2 border-tinta px-5 pt-5 pb-[max(28px,env(safe-area-inset-bottom))] data-[state=open]:animate-sheet-naik data-[state=closed]:animate-sheet-turun sm:mx-auto sm:max-w-lg sm:border-x-2",
          side === "right" &&
            "inset-y-0 right-0 w-[min(420px,100%)] overflow-y-auto border-l-2 border-tinta p-6 data-[state=open]:animate-sheet-kanan data-[state=closed]:animate-sheet-kanan-keluar",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute top-2.5 right-3 inline-flex size-11 items-center justify-center rounded-kecil text-hijau outline-none hover:bg-hijau/8 focus-visible:outline-3 focus-visible:outline-hijau">
            <XIcon weight="bold" className="size-5" />
            <span className="sr-only">Tutup</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1 pr-10", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("mt-2 flex flex-col gap-3", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("text-xl font-extrabold", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-[13px] leading-normal text-teks-2", className)} {...props} />
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger }
