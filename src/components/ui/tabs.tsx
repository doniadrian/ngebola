"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

// Navigasi.html "Tab dalam halaman": garis bawah 4px hijau untuk tab aktif, untuk berpindah isi daftar.
function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-4", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("flex gap-1 overflow-x-auto border-b-2 border-nonaktif-tepi [scrollbar-width:none]", className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "-mb-[2px] flex h-12 shrink-0 items-center gap-2 border-b-4 border-transparent transition-[color,border-color] duration-200 px-4 text-[15px] font-semibold whitespace-nowrap text-teks-2 outline-none hover:text-hijau focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-hijau disabled:text-placeholder data-[state=active]:border-hijau data-[state=active]:font-extrabold data-[state=active]:text-hijau",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("outline-none", className)} {...props} />
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
