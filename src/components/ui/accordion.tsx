"use client"

import * as React from "react"
import { MinusIcon, PlusIcon } from "@phosphor-icons/react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

// Gaya stiker: tiap butir kartu bertepi 2px tinta; terbuka = bayangan emas, ikon + jadi −.
function Accordion(props: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" className="flex flex-col gap-2" {...props} />
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("rounded-besar border-2 border-tinta bg-krem-terang transition-shadow data-[state=open]:shadow-keras-sm data-[state=open]:shadow-emas", className)}
      {...props}
    />
  )
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex min-h-12 flex-1 items-center justify-between gap-3 rounded-besar px-4 py-3 text-left text-base font-extrabold outline-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-hijau",
          className
        )}
        {...props}
      >
        {children}
        <PlusIcon weight="bold" aria-hidden className="size-5 shrink-0 text-hijau group-data-[state=open]:hidden" />
        <MinusIcon weight="bold" aria-hidden className="hidden size-5 shrink-0 text-hijau group-data-[state=open]:block" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("px-4 pb-4 text-[15px] leading-relaxed text-teks-2", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
