import { FunnelIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AREA, FORMAT, LABEL_FORMAT, LABEL_LEVEL, LEVEL } from "@/db/enums"

type Nilai = { cari?: string; area?: string; format?: string; level?: string }

const SEMUA = "semua"

/** Filter club/area, format, level (PRD 1, M-02). Form GET biasa agar bisa dibagikan sebagai tautan. */
export function FilterTerbuka({ action, nilai, className }: { action: string; nilai: Nilai; className?: string }) {
  const aktif = [nilai.area, nilai.format, nilai.level].filter(Boolean).length
  return (
    <form action={action} method="get" className={cn("relative z-10 grid grid-cols-2 gap-2.5 rounded-kartu border-2 border-tinta bg-krem-terang p-3 shadow-keras shadow-emas md:flex md:flex-row md:flex-wrap md:items-end md:gap-3 md:p-4", className)}>
      <label className="col-span-2 flex h-[52px] flex-1 items-center gap-2.5 rounded-full border-2 border-hijau bg-krem-terang pr-2 pl-4 has-[:focus-visible]:bg-white has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emas/60 md:min-w-64">
        <MagnifyingGlassIcon weight="bold" className="size-5 shrink-0 text-hijau" aria-hidden />
        <span className="sr-only">Cari nama club atau area</span>
        <input name="cari" defaultValue={nilai.cari} placeholder="Nama club atau area" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-placeholder" />
      </label>
      <div className="contents md:flex md:gap-3">
        <Select name="area" defaultValue={nilai.area ?? SEMUA}>
          <SelectTrigger aria-label="Area" className="col-span-2 md:col-span-1 md:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SEMUA}>Semua area</SelectItem>
            {AREA.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="format" defaultValue={nilai.format ?? SEMUA}>
          <SelectTrigger aria-label="Format" className="col-span-2 px-3 text-[15px] min-[440px]:col-span-1 md:w-44 md:px-4 md:text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SEMUA}>Semua format</SelectItem>
            {FORMAT.map((f) => (
              <SelectItem key={f} value={f}>{LABEL_FORMAT[f]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="level" defaultValue={nilai.level ?? SEMUA}>
          <SelectTrigger aria-label="Level" className="col-span-2 px-3 text-[15px] min-[440px]:col-span-1 md:w-40 md:px-4 md:text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SEMUA}>Semua level</SelectItem>
            {LEVEL.map((l) => (
              <SelectItem key={l} value={l}>{LABEL_LEVEL[l]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="garis" type="submit" className="col-span-2 w-full md:col-span-1 md:ml-auto md:w-auto">
        <FunnelIcon weight="bold" aria-hidden />
        Terapkan{aktif ? ` (${aktif})` : ""}
      </Button>
    </form>
  )
}

/** Baca filter dari searchParams; "semua"/kosong = tanpa filter. */
export function bacaFilter<T extends string>(nilai: string | string[] | undefined, daftar: readonly T[]): T | undefined {
  return typeof nilai === "string" && (daftar as readonly string[]).includes(nilai) ? (nilai as T) : undefined
}
