import type { Metadata } from "next";
import { bacaFilter } from "@/components/ngebola/filter-terbuka";
import { HeaderHalaman } from "@/components/ngebola/header";
import { Leaderboard } from "@/components/ngebola/leaderboard";
import { FORMAT } from "@/db/enums";
import { requireRole } from "@/server/authz";
import { leaderboard } from "@/server/queries/publik";

export const metadata: Metadata = { title: "Peringkat" };

export default async function Page({ searchParams }: PageProps<"/pemain/peringkat">) {
  await requireRole("player");
  const sp = await searchParams;
  const format = bacaFilter(sp.format, FORMAT) ?? "mini";
  const cari = typeof sp.cari === "string" ? sp.cari : undefined;
  return (
    <>
      <HeaderHalaman judul="Peringkat" />
      <Leaderboard dasar="/pemain/peringkat" format={format} data={leaderboard(format, cari)} cari={cari} />
    </>
  );
}
