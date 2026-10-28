import type { Metadata } from "next";
import { bacaFilter } from "@/components/ngebola/filter-terbuka";
import { HeroHalaman } from "@/components/ngebola/seksi";
import { KerangkaPublik } from "@/components/ngebola/kerangka-publik";
import { CatatanPeringkat, Leaderboard } from "@/components/ngebola/leaderboard";
import { FORMAT, LABEL_FORMAT } from "@/db/enums";
import { leaderboard } from "@/server/queries/publik";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function Page({ searchParams }: PageProps<"/leaderboard">) {
  const sp = await searchParams;
  const format = bacaFilter(sp.format, FORMAT) ?? "mini";
  const cari = typeof sp.cari === "string" ? sp.cari : undefined;
  return (
    <KerangkaPublik
      aktif="/leaderboard"
      hero={
        <HeroHalaman kicker="Papan peringkat" judul={`Club terbaik ${LABEL_FORMAT[format].toLowerCase()} Pekanbaru`} tumpang>
          Rating Elo per format dari hasil yang dikonfirmasi kedua club.
        </HeroHalaman>
      }
    >
      <div className="relative z-10 -mt-16 grid grid-cols-1 gap-5 md:-mt-20 lg:grid-cols-[1fr_340px] lg:items-start">
        <Leaderboard dasar="/leaderboard" format={format} data={leaderboard(format, cari)} cari={cari} />
        <CatatanPeringkat format={format} tautan={false} />
      </div>
    </KerangkaPublik>
  );
}
