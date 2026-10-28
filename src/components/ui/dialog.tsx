"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 z-50 bg-tinta/60 data-[state=open]:animate-lapis-masuk data-[state=closed]:animate-lapis-keluar", className)}
      {...props}
    />
  )
}

// Umpan-Balik.html "Dialog konfirmasi": papan krem, tepi tinta, bayangan 6px, sudut 22.
function DialogContent({ className, children, showCloseButton = false, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-36px)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-3.5 overflow-y-auto rounded-dialog border-2 border-tinta bg-krem-terang px-5 pt-6 pb-5 text-tinta shadow-keras-xl shadow-tinta outline-none data-[state=open]:animate-dialog-masuk data-[state=closed]:animate-dialog-keluar",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-kecil text-hijau outline-none hover:bg-hijau/8 focus-visible:outline-3 focus-visible:outline-hijau">
            <XIcon weight="bold" className="size-5" />
            <span className="sr-only">Tutup</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-2", className)} {...props} />
}

/** Tombol ditumpuk; tombol aman diletakkan paling bawah (dekat jempol). */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("mt-1.5 flex flex-col gap-3 [&>*]:w-full", className)} {...props} />
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-[22px] leading-tight font-extrabold", className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-sm leading-relaxed text-teks-2", className)} {...props} />
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger }
