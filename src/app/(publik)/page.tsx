import type { Metadata } from "next"
import { bacaFilter } from "@/components/ngebola/filter-terbuka"
import { CaraKerja, Faq, Hero, KenapaPercaya, MatchTerbukaRingkas, SeksiLeaderboard, StripAngka, UntukSiapa } from "@/components/ngebola/beranda"
import { Leaderboard } from "@/components/ngebola/leaderboard"
import { KerangkaPublik } from "@/components/ngebola/kerangka-publik"
import { FORMAT } from "@/db/enums"
import { FAQ } from "@/lib/faq"
import { DESKRIPSI_BERANDA, JUDUL_BERANDA, NAMA_SITUS, jsonLd, situsUrl } from "@/lib/situs"
import { getCurrentUser } from "@/server/auth/session"
import { BERANDA_PERAN } from "@/server/authz"
import { hasilTerbaru, leaderboard, matchTerbuka, statistikBeranda } from "@/server/queries/publik"

export const metadata: Metadata = {
  title: { absolute: JUDUL_BERANDA },
  description: DESKRIPSI_BERANDA,
  alternates: { canonical: "/" },
}

export default async function Page({ searchParams }: PageProps<"/">) {
  const user = await getCurrentUser()
  const rumah = user ? BERANDA_PERAN[user.role] : "/daftar"
  const format = bacaFilter((await searchParams).format, FORMAT) ?? "mini"
  const papan = leaderboard(format)
  const terbuka = matchTerbuka().slice(0, 3)
  const hasil = hasilTerbaru()
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: NAMA_SITUS, url: situsUrl("/"), areaServed: "Pekanbaru, Riau, Indonesia" },
      { "@type": "WebSite", name: NAMA_SITUS, url: situsUrl("/"), inLanguage: "id-ID" },
      { "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  }
  return (
    <KerangkaPublik hero={<Hero masuk={!!user} rumah={rumah} contoh={terbuka[0]} hasil={hasil} />}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <StripAngka s={statistikBeranda()} />
      <CaraKerja />
      <MatchTerbukaRingkas data={terbuka} />
      <KenapaPercaya hasil={hasil} />
      <SeksiLeaderboard format={format}>
        <Leaderboard dasar="/leaderboard" format={format} data={{ resmi: papan.resmi.slice(0, 5), sementara: papan.sementara.slice(0, 3) }} ringkas />
      </SeksiLeaderboard>
      <UntukSiapa />
      <Faq />
    </KerangkaPublik>
  )
}
