import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"
import { SpinnerGapIcon } from "@phosphor-icons/react/ssr"

// docs/referensi/Anatomi.html, Matriks.html, Gelap.html. Tepi 2px, bayangan keras tanpa blur,
// hover naik 1px (bayangan +1), ditekan turun 4px (bayangan hilang), nonaktif krem abu.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center border-2 font-bold whitespace-nowrap select-none outline-none [transition-property:translate,box-shadow,background-color,border-color,color] [transition-timing-function:var(--ease-pegas),var(--ease-pegas),ease-out,ease-out,ease-out] duration-[240ms] tekan:duration-60 tekan:[transition-timing-function:ease-out] [&_svg]:transition-[scale] [&_svg]:duration-150 not-disabled:tekan:[&_svg]:scale-90 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-hijau disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        utama:
          "border-hijau bg-hijau text-krem shadow-emas not-disabled:hover:border-hijau-hover not-disabled:hover:bg-hijau-hover not-disabled:tekan:border-hijau-tua not-disabled:tekan:bg-hijau-tua",
        emas: "border-hijau bg-emas text-tinta shadow-hijau not-disabled:hover:bg-emas-hover not-disabled:tekan:bg-emas-tekan",
        garis: "border-hijau bg-krem-terang text-hijau shadow-hijau not-disabled:hover:bg-white not-disabled:tekan:bg-krem-tekan",
        teks: "min-w-0 border-transparent bg-transparent text-hijau underline decoration-2 underline-offset-5 shadow-none! not-disabled:hover:bg-hijau/8 not-disabled:tekan:bg-hijau/16 not-disabled:tekan:text-hijau-tua",
        bahaya: "border-hijau bg-merah text-white shadow-hijau not-disabled:hover:bg-merah-hover not-disabled:tekan:bg-merah-tekan",
      },
      size: {
        k: "h-10 min-w-[88px] gap-1.5 rounded-kecil px-4 text-sm shadow-keras-sm not-disabled:hover:-translate-y-px not-disabled:hover:shadow-keras not-disabled:tekan:shadow-none not-disabled:tekan:translate-y-[3px] [&_svg]:size-4",
        s: "h-12 min-w-[112px] gap-2 rounded-tombol px-[22px] text-base shadow-keras not-disabled:hover:-translate-y-px not-disabled:hover:shadow-keras-lg not-disabled:tekan:shadow-none not-disabled:tekan:translate-y-1 [&_svg]:size-5",
        b: "h-14 min-w-[112px] gap-2.5 rounded-besar px-7 text-lg font-extrabold shadow-keras-lg not-disabled:hover:-translate-y-px not-disabled:hover:shadow-keras-xl not-disabled:tekan:shadow-none not-disabled:tekan:translate-y-[5px] [&_svg]:size-6",
        // Tombol ikon persegi (header, filter). Area sentuh 44px.
        ikon: "size-11 min-w-0 rounded-tombol p-0 shadow-keras-sm not-disabled:hover:-translate-y-px not-disabled:hover:shadow-keras not-disabled:tekan:shadow-none not-disabled:tekan:translate-y-[3px] [&_svg]:size-5",
        // Tombol mengambang: bulat penuh.
        bulat: "size-16 min-w-0 rounded-full p-0 shadow-keras-lg not-disabled:hover:-translate-y-px not-disabled:hover:shadow-keras-xl not-disabled:tekan:shadow-none not-disabled:tekan:translate-y-[5px] [&_svg]:size-7",
      },
      // Di atas latar hijau (Gelap.html): Utama jadi emas, bayangan hijau paling gelap.
      permukaan: { terang: "", gelap: "" },
    },
    compoundVariants: [
      { permukaan: "gelap", variant: "utama", className: "border-hijau-tua bg-emas text-tinta shadow-hijau-tua not-disabled:hover:border-hijau-tua not-disabled:hover:bg-emas-hover not-disabled:tekan:border-hijau-tua not-disabled:tekan:bg-emas-tekan" },
      { permukaan: "gelap", variant: "emas", className: "border-hijau-tua bg-krem text-hijau shadow-hijau-tua not-disabled:hover:bg-white not-disabled:tekan:bg-krem-tekan" },
      { permukaan: "gelap", variant: "garis", className: "border-krem bg-transparent text-krem shadow-hijau-tua not-disabled:hover:bg-krem/10 not-disabled:tekan:bg-krem/20" },
      { permukaan: "gelap", variant: "teks", className: "text-krem decoration-emas not-disabled:hover:bg-krem/10 not-disabled:tekan:bg-krem/20 not-disabled:tekan:text-krem" },
      { permukaan: "gelap", variant: "bahaya", className: "border-hijau-tua bg-merah-gelap shadow-hijau-tua not-disabled:hover:bg-merah-hover not-disabled:tekan:bg-merah-tekan" },
      { permukaan: "gelap", className: "focus-visible:outline-emas" },
    ],
    defaultVariants: { variant: "utama", size: "s", permukaan: "terang" },
  }
)

// Nonaktif: semua varian sama, krem abu tanpa bayangan (Teks: tanpa latar).
const nonaktif =
  "disabled:border-nonaktif-tepi disabled:bg-nonaktif-bg disabled:text-placeholder disabled:shadow-none aria-disabled:border-nonaktif-tepi aria-disabled:bg-nonaktif-bg aria-disabled:text-placeholder aria-disabled:shadow-none"
const nonaktifTeks =
  "disabled:text-nonaktif-teks disabled:decoration-nonaktif-tepi aria-disabled:text-nonaktif-teks aria-disabled:decoration-nonaktif-tepi"

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Memuat: lebar tetap, spinner, tidak bisa diklik ulang. */
    loading?: boolean
  }

function Button({ className, variant = "utama", size = "s", permukaan = "terang", asChild = false, loading = false, disabled, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={asChild ? undefined : disabled || loading}
      aria-disabled={asChild && disabled ? true : undefined}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ variant, size, permukaan }),
        // Saat memuat tombol tetap berwarna aslinya, hanya tidak bisa diklik.
        loading ? "cursor-wait! disabled:cursor-wait" : variant === "teks" ? nonaktifTeks : nonaktif,
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="invisible inline-flex items-center gap-[inherit]">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <SpinnerGapIcon weight="bold" className="animate-spin" aria-hidden />
            <span className="sr-only">Memuat</span>
          </span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
