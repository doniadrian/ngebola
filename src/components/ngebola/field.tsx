import type { ReactNode } from "react"
import { WarningCircleIcon } from "@phosphor-icons/react/ssr"
import { cn } from "@/lib/utils"

/** Id pesan bantuan/error untuk aria-describedby. */
export const idPesan = (id: string) => `${id}-pesan`

// Form.html: label 14/700, bantuan 13 teks-2, error 13/700 merah dengan ikon.
export function Field({
  id,
  label,
  opsional,
  hint,
  error,
  children,
  className,
}: {
  id: string
  label: ReactNode
  opsional?: boolean
  hint?: ReactNode
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
        {opsional && <span className="font-semibold text-teks-2"> (opsional)</span>}
      </label>
      {children}
      {error ? (
        <p id={idPesan(id)} role="alert" className="flex items-start gap-1.5 text-[13px] font-bold text-merah">
          <WarningCircleIcon weight="bold" aria-hidden className="mt-px size-4 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={idPesan(id)} className="text-[13px] leading-snug text-teks-2">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/** Props aksesibilitas untuk kolom di dalam Field. */
export const propsKolom = (id: string, error?: string, hint?: unknown) => ({
  id,
  name: id,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error || hint ? idPesan(id) : undefined,
})
