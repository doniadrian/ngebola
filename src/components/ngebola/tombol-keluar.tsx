import { SignOutIcon } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"
import { keluarAction } from "@/server/actions/auth"

/** Keluar dari akun (mencabut sesi di server). Di HP ada di tab Club/Profil/Lainnya; di desktop di sidebar. */
export function TombolKeluar({ className }: { className?: string }) {
  return (
    <form action={keluarAction} className={className}>
      <Button variant="garis" className="w-full">
        <SignOutIcon weight="bold" aria-hidden />
        Keluar
      </Button>
    </form>
  )
}
