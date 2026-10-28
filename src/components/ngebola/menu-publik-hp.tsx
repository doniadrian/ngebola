"use client"

import Link from "next/link"
import { ListIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

/** Menu publik di HP: tombol menu di pil header membuka bottom sheet, supaya header tidak sesak di layar sempit. */
export function MenuPublikHp({ menu, aktif, masuk }: { menu: { href: string; label: string }[]; aktif?: string; masuk: boolean }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="garis" size="ikon" className="size-11 lg:hidden" aria-label="Buka menu">
          <ListIcon weight="bold" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Navigasi halaman publik Ngebola</SheetDescription>
        </SheetHeader>
        <nav aria-label="Menu publik" className="flex flex-col gap-2">
          {menu.map((m) => (
            <SheetClose asChild key={m.href}>
              <Link
                href={m.href}
                aria-current={aktif === m.href ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center rounded-tombol border-2 border-nonaktif-tepi bg-krem-terang px-4 text-base font-semibold outline-none focus-visible:outline-3 focus-visible:outline-hijau",
                  aktif === m.href && "border-tinta font-extrabold shadow-keras-sm shadow-emas"
                )}
              >
                {m.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        {!masuk && (
          <SheetClose asChild>
            <Button asChild variant="garis" size="b">
              <Link href="/masuk">Masuk</Link>
            </Button>
          </SheetClose>
        )}
      </SheetContent>
    </Sheet>
  )
}
