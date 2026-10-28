import type { ComponentType } from "react"
import {
  ArrowsLeftRightIcon,
  CheckIcon,
  ClipboardTextIcon,
  FlagCheckeredIcon,
  GavelIcon,
  HourglassSimpleIcon,
  MagnifyingGlassIcon,
  PauseIcon,
  PencilSimpleIcon,
  ProhibitIcon,
  SoccerBallIcon,
  TimerIcon,
} from "@phosphor-icons/react/ssr"
import type { IconProps } from "@phosphor-icons/react"
import { Badge, type badgeVariants } from "@/components/ui/badge"
import { LABEL_STATUS_MATCH, type StatusMatch } from "@/db/enums"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"

type Varian = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

/** Kartu merah/kuning ala wasit (Lambang.html): Ditolak = kartu merah, WO/terlambat = kartu kuning. */
export function KartuWasit({ warna }: { warna: "merah" | "kuning" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block h-[13px] w-[9px] rounded-[2px] border-[1.5px] border-tinta",
        warna === "merah" ? "rotate-12 bg-merah" : "-rotate-10 bg-kuning-kartu"
      )}
    />
  )
}

const Bendera = (p: IconProps) => <FlagCheckeredIcon {...p} weight="fill" />

// Status tambahan (di luar 5 badge referensi) memakai bentuk dan token yang sama (PLAN.md butir 16).
const PETA: Record<StatusMatch, { varian: Varian; Ikon?: ComponentType<IconProps>; kartu?: "merah" | "kuning" }> = {
  draf: { varian: "netral", Ikon: PencilSimpleIcon },
  terbuka: { varian: "saran", Ikon: MagnifyingGlassIcon },
  ditantang: { varian: "menunggu", Ikon: TimerIcon },
  dinegosiasi: { varian: "ditawar", Ikon: ArrowsLeftRightIcon },
  terkonfirmasi: { varian: "diterima", Ikon: CheckIcon },
  ditunda: { varian: "menunggu", Ikon: PauseIcon },
  berlangsung: { varian: "saran", Ikon: SoccerBallIcon },
  menunggu_hasil: { varian: "menunggu", Ikon: ClipboardTextIcon },
  selesai: { varian: "selesai", Ikon: Bendera },
  sengketa: { varian: "bahaya", Ikon: GavelIcon },
  ditolak: { varian: "ditolak", kartu: "merah" },
  kedaluwarsa: { varian: "selesai", Ikon: HourglassSimpleIcon },
  dibatalkan: { varian: "ditolak", Ikon: ProhibitIcon },
  wo: { varian: "netral", kartu: "kuning" },
}

export function BadgeStatus({ status, label, className }: { status: StatusMatch; label?: string; className?: string }) {
  const { varian, Ikon, kartu } = PETA[status]
  return (
    <Badge variant={varian} className={className}>
      {kartu ? <KartuWasit warna={kartu} /> : Ikon && <Ikon weight="bold" aria-hidden className={cn(status === "terkonfirmasi" && "text-emas")} />}
      {label ?? LABEL_STATUS_MATCH[status]}
    </Badge>
  )
}
