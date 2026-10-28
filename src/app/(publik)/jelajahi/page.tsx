import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { KartuMatchTerbuka } from "@/components/ngebola/club";
import { bacaFilter, FilterTerbuka } from "@/components/ngebola/filter-terbuka";
import { HeroHalaman } from "@/components/ngebola/seksi";
import { KerangkaPublik } from "@/components/ngebola/kerangka-publik";
import { Banner, KartuKosong } from "@/components/ngebola/umpan-balik";
import { Button } from "@/components/ui/button";
import { AREA, FORMAT, LEVEL } from "@/db/enums";
import { getCurrentUser } from "@/server/auth/session";
import { clubMilikAdmin } from "@/server/queries/identitas";
import { matchTerbuka } from "@/server/queries/publik";

export const metadata: Metadata = { title: "Match terbuka" };

export default async function Page({ searchParams }: PageProps<"/jelajahi">) {
  const sp = await searchParams;
  const filter = {
    cari: typeof sp.cari === "string" ? sp.cari : undefined,
    area: bacaFilter(sp.area, AREA),
    format: bacaFilter(sp.format, FORMAT),
    level: bacaFilter(sp.level, LEVEL),
  };
  const user = await getCurrentUser();
  const clubSendiri = user?.role === "club_admin" ? clubMilikAdmin(user.id) : null;
  const daftar = matchTerbuka(filter, { viewerClubId: clubSendiri?.id });

  const aksi = (id: string) => {
    const tujuan = `/club/cari-lawan?match=${id}`;
    if (!user) {
      return (
        <Button asChild size="k">
          <Link href={`/daftar?peran=club_admin&lanjut=${encodeURIComponent(tujuan)}`}>
            Ikut Sparring
            <ArrowRightIcon weight="bold" aria-hidden />
          </Link>
        </Button>
      );
    }
    if (user.role === "club_admin") {
      return (
        <Button asChild size="k">
          <Link href={tujuan}>Lihat & Terima</Link>
        </Button>
      );
    }
    return null;
  };

  return (
    <KerangkaPublik
      aktif="/jelajahi"
      hero={
        <HeroHalaman kicker="Sedang mencari lawan" judul="Match terbuka di Pekanbaru" tumpang>
          Club terverifikasi yang sedang mencari lawan sparring. Saring menurut area, format, dan level, lalu pilih salah satu opsi jadwalnya.
        </HeroHalaman>
      }
    >
      {!user && (
        <Banner jenis="saran">
          Untuk ikut sparring, daftarkan club dulu. Club baru diverifikasi Admin platform sebelum bisa menerima tantangan.
        </Banner>
      )}
      <FilterTerbuka action="/jelajahi" nilai={filter} className="order-first -mt-16 md:-mt-20" />
      {daftar.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {daftar.map((m) => (
            <KartuMatchTerbuka key={m.match.id} m={m} aksi={aksi(m.match.id)} />
          ))}
        </div>
      ) : (
        <KartuKosong judul="Belum ada match terbuka">
          {filter.cari || filter.area || filter.format || filter.level ? "Tidak ada yang cocok dengan filter ini. Coba longgarkan filternya." : "Club terverifikasi yang sedang mencari lawan akan muncul di sini."}
        </KartuKosong>
      )}
    </KerangkaPublik>
  );
}
