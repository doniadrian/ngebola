"use client"

import { Toaster as Sonner, toast as sonner, type ExternalToast, type ToasterProps } from "sonner"
import { CheckIcon, InfoIcon, WarningCircleIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react"

// Umpan-Balik.html "Toast": muncul di atas bar navigasi, 4 detik. Hijau = berhasil, Tinta = netral/bisa
// diurungkan, Merah = gagal (tidak hilang sendiri), Krem = info. Maksimal satu baris + satu aksi.
const Toaster = (props: ToasterProps) => (
  <Sonner
    position="bottom-center"
    duration={4000}
    offset={24}
    mobileOffset={{ bottom: "calc(env(safe-area-inset-bottom) + 112px)", left: 16, right: 16 }}
    icons={{
      success: (
        <span className="flex size-[30px] items-center justify-center rounded-full border-[1.5px] border-hijau-tua bg-emas text-hijau">
          <CheckIcon weight="bold" className="size-4" />
        </span>
      ),
      info: <InfoIcon weight="bold" className="size-5 text-hijau" />,
      error: <WarningCircleIcon weight="bold" className="size-5" />,
    }}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast:
          "flex w-full items-center gap-3 rounded-besar border-2 border-tinta bg-tinta py-3 pr-3 pl-3.5 text-sm leading-snug text-krem shadow-keras shadow-emas sm:w-[400px]",
        success: "border-hijau-tua! bg-hijau! text-krem! shadow-hijau-tua!",
        error: "bg-merah! text-white! shadow-tinta!",
        info: "bg-krem-terang! text-tinta! shadow-tinta!",
        title: "font-bold",
        description: "opacity-90",
        content: "flex-1",
        icon: "shrink-0",
        actionButton:
          "h-9 shrink-0 rounded-[9px] border-[1.5px] border-emas bg-transparent px-3 text-[13px] font-extrabold text-emas outline-none focus-visible:outline-3 focus-visible:outline-emas",
        cancelButton: "h-9 shrink-0 px-2 text-[13px] font-bold underline underline-offset-3",
        closeButton: "hidden",
      },
    }}
    {...props}
  />
)

type Opsi = Omit<ExternalToast, "duration">

/** Pembungkus toast dengan aturan durasi dari referensi. */
const toast = {
  berhasil: (pesan: React.ReactNode, opsi?: Opsi) => sonner.success(pesan, opsi),
  info: (pesan: React.ReactNode, opsi?: Opsi) => sonner.info(pesan, opsi),
  /** Gagal: tidak hilang sendiri sampai diketuk atau dicoba lagi. */
  gagal: (pesan: React.ReactNode, opsi?: Opsi) => sonner.error(pesan, { duration: Infinity, dismissible: true, ...opsi }),
  /** Netral dengan "Urungkan" 6 detik (hanya untuk aksi yang benar-benar bisa dibalik, PLAN.md butir 23). */
  urungkan: (pesan: React.ReactNode, onUrungkan: () => void) =>
    sonner(pesan, {
      duration: 6000,
      icon: <ArrowCounterClockwiseIcon weight="bold" className="size-5 text-emas" />,
      action: { label: "Urungkan", onClick: onUrungkan },
    }),
}

export { Toaster, toast }
