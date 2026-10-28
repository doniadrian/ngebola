import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DaftarRiwayat, IdentitasClub, LimaLaga, PeringatanKeandalan } from "@/components/ngebola/club";
import { FormMatchBaru } from "@/components/ngebola/form-match-baru";
import { HeaderHalaman } from "@/components/ngebola/header";
import { StatusRegistrasi } from "@/components/ngebola/status-registrasi";
import { Banner } from "@/components/ngebola/umpan-balik";
import { Card, LabelSeksi } from "@/components/ui/card";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { requireRole } from "@/server/authz";
import { bolehBertanding, clubMilik } from "@/server/club";
import { salingBlokir } from "@/server/match";
import { clubDariSlug, headToHead, statistikClub, tampilPublik } from "@/server/queries/club";
import { opsiLapangan } from "@/server/queries/venue";

export const metadata: Metadata = { title: "Tantang club" };

/** Layar tantangan (M-03): head-to-head & keandalan calon lawan tampil di sini (C-04, 7.2). */
export default async function Page({ params, searchParams }: PageProps<"/club/tantang/[slug]">) {
  const user = await requireRole("club_admin");
  const club = clubMilik(user.id);
  if (!club) redirect("/club/daftar-club");
  const lawan = clubDariSlug((await params).slug);
  if (!tampilPublik(lawan) || lawan.id === club.id) notFound();
  const { rematch } = await searchParams;
  const asal = typeof rematch === "string" ? db.select().from(matches).where(eq(matches.id, rematch)).get() : undefined;
  const rematchSah = asal && asal.status === "selesai" && [asal.creatorClubId, asal.opponentClubId].includes(club.id) && [asal.creatorClubId, asal.opponentClubId].includes(lawan.id) ? asal : undefined;

  const s = statistikClub(lawan.id);
  const h2h = headToHead(club.id, lawan.id);

  return (
    <>
      <HeaderHalaman judul={rematchSah ? "Ajak main lagi" : "Tantang club"} kembali={`/profil-club/${lawan.slug}`} />
      <Card>
        <div className="flex items-center justify-between gap-3">
          <IdentitasClub club={lawan} ukuran={56} tautan sub={`${lawan.area} · rating mini ${s.rating.mini?.rating ?? "—"} · football ${s.rating.football?.rating ?? "—"}`} />
          <LimaLaga hasil={s.limaTerakhir} />
        </div>
        <PeringatanKeandalan s={s} />
        <p className="text-[13px] text-teks-2">
          Keandalan {s.keandalan.baru ? "baru" : `${s.keandalan.persen}%`} · Head-to-head: {h2h.menang} M · {h2h.seri} S · {h2h.kalah} K
        </p>
        {h2h.hasil.length > 0 && <DaftarRiwayat riwayat={h2h.hasil} />}
      </Card>
      {!bolehBertanding(club) ? (
        <StatusRegistrasi club={club} />
      ) : salingBlokir(club.id, lawan.id) ? (
        <Banner jenis="tindakan">Club ini tidak bisa ditantang.</Banner>
      ) : (
        <section className="flex flex-col gap-3">
          <LabelSeksi>Detail tantangan</LabelSeksi>
          <FormMatchBaru
            jenis="tantangan"
            lawanClubId={lawan.id}
            venues={opsiLapangan()}
            areaClub={club.area}
            levelClub={club.level}
            awal={rematchSah ? { format: rematchSah.format, venueId: rematchSah.venueId, manualName: rematchSah.manualVenueName, manualAddress: rematchSah.manualVenueAddress, feeTotal: rematchSah.feeTotal, rematchOf: rematchSah.id } : undefined}
          />
          <p className="text-[13px] text-teks-2">
            Lawan punya 72 jam (atau sampai 24 jam sebelum jadwal) untuk menerima, menolak, atau menawar balik. <Link href="/club/jadwal" className="font-bold text-hijau underline underline-offset-4">Lihat ajakan lain</Link>
          </p>
        </section>
      )}
    </>
  );
}
