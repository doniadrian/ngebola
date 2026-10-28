import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DaftarMatchClub } from "@/components/ngebola/daftar-match-club";
import { HeaderHalaman } from "@/components/ngebola/header";
import { Hitungan } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { requireRole } from "@/server/authz";
import { clubMilik } from "@/server/club";
import { kelompokJadwal } from "@/server/queries/jadwal-club";

export const metadata: Metadata = { title: "Jadwal" };

const TAB = [
  ["masuk", "Masuk"],
  ["terkirim", "Terkirim"],
  ["jadwal", "Jadwal"],
  ["riwayat", "Riwayat"],
] as const;
const KOSONG = {
  masuk: "Tidak ada ajakan yang perlu kamu jawab.",
  terkirim: "Belum ada ajakan terkirim atau match terbuka.",
  jadwal: "Belum ada match terjadwal.",
  riwayat: "Belum ada riwayat match.",
};

export default async function Page({ searchParams }: PageProps<"/club/jadwal">) {
  const user = await requireRole("club_admin");
  const club = clubMilik(user.id);
  if (!club) redirect("/club/daftar-club");
  const k = kelompokJadwal(club.id);
  const sp = await searchParams;
  const bawaan = k.masuk.length ? "masuk" : "jadwal";
  const tab = TAB.some(([t]) => t === sp.tab) ? (sp.tab as (typeof TAB)[number][0]) : bawaan;

  return (
    <>
      <HeaderHalaman judul="Jadwal" />
      <nav aria-label="Jadwal" className="flex gap-1 overflow-x-auto border-b-2 border-nonaktif-tepi [scrollbar-width:none]">
        {TAB.map(([t, label]) => (
          <Link
            key={t}
            href={`/club/jadwal?tab=${t}`}
            aria-current={tab === t ? "page" : undefined}
            className={cn(
              "-mb-[2px] flex h-12 shrink-0 items-center gap-2 border-b-4 px-4 text-[15px] outline-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-hijau",
              tab === t ? "border-hijau font-extrabold text-hijau" : "border-transparent font-semibold text-teks-2",
            )}
          >
            {label}
            {t === "masuk" && <Hitungan jumlah={k.masuk.length} label={`${k.masuk.length} perlu dijawab`} />}
          </Link>
        ))}
      </nav>
      <DaftarMatchClub items={k[tab]} clubId={club.id} tanggal={k.tanggal} kosong={KOSONG[tab]} perluSetuju={k.perluSetuju} />
    </>
  );
}
