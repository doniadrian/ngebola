import { SignInIcon } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"
import { AKUN_DEMO, DEMO_AKTIF } from "@/lib/demo"
import { masukDemoAction } from "@/server/actions/demo"

/** Pintasan masuk untuk demo (tanpa mengetik email/password). Tidak dirender di production. */
export function PanelDemo() {
  if (!DEMO_AKTIF) return null
  return (
    <section aria-labelledby="h-demo" className="flex flex-col gap-3 rounded-besar border-2 border-dashed border-emas-tua bg-bg-menunggu/50 p-4">
      <div className="flex flex-col gap-0.5">
        <h2 id="h-demo" className="text-[13px] font-extrabold tracking-[.1em] text-emas-tua uppercase">Mode demo · masuk cepat</h2>
        <p className="text-sm text-teks-2">Pilih peran untuk langsung masuk dengan data contoh.</p>
      </div>
      <form action={masukDemoAction} className="grid gap-2 sm:grid-cols-2">
        {AKUN_DEMO.map((a) => (
          <Button key={a.email} type="submit" name="email" value={a.email} variant="garis" size="k" className="h-auto min-h-12 justify-start gap-3 py-2 text-left">
            <SignInIcon weight="bold" aria-hidden className="shrink-0" />
            <span className="flex flex-col leading-tight">
              <span>{a.peran}</span>
              <span className="text-xs font-semibold text-teks-2">{a.sub}</span>
            </span>
          </Button>
        ))}
      </form>
    </section>
  )
}
