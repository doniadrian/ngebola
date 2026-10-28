import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SwordIcon } from "@phosphor-icons/react/ssr";
import { DaftarRiwayat } from "@/components/ngebola/club";
import { KerangkaPublik } from "@/components/ngebola/kerangka-publik";
import { HeroProfilClub, ProfilClub } from "@/components/ngebola/profil-club";
import { Seksi } from "@/components/ngebola/seksi";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/session";
import { bolehBertanding } from "@/server/club";
import { clubDariSlug, galeriClub, headToHead, riwayatHasil, statistikClub, tampilPublik } from "@/server/queries/club";
import { clubMilikAdmin } from "@/server/queries/identitas";

export async function generateMetadata({ params }: PageProps<"/profil-club/[slug]">): Promise<Metadata> {
  const club = clubDariSlug((await params).slug);
  return { title: tampilPublik(club) ? club.name : "Club tidak ditemukan" };
}

export default async function Page({ params }: PageProps<"/profil-club/[slug]">) {
  const club = clubDariSlug((await params).slug);
  if (!tampilPublik(club)) notFound();

  const user = await getCurrentUser();
  const clubSaya = user?.role === "club_admin" ? clubMilikAdmin(user.id) : null;
  const lawanLain = clubSaya && clubSaya.id !== club.id ? clubSaya : null;
  const h2h = lawanLain ? headToHead(lawanLain.id, club.id) : null;

  const s = statistikClub(club.id);
  return (
    <KerangkaPublik
      hero={
        <HeroProfilClub
          club={club}
          s={s}
          aksi={
            lawanLain && bolehBertanding(lawanLain) ? (
              <Button asChild permukaan="gelap" size="b">
                <Link href={`/club/tantang/${club.slug}`}>
                  <SwordIcon weight="bold" aria-hidden />
                  Tantang Club
                </Link>
              </Button>
            ) : null
          }
        />
      }
    >
      <ProfilClub
        club={club}
        s={s}
        riwayat={riwayatHasil(club.id)}
        galeri={galeriClub(club.id)}
        tambahan={
          h2h && lawanLain ? (
            <Seksi id="h2h" kicker="Head-to-head" judul={`${lawanLain.name} vs ${club.name}`} ukuran="sedang">
              <p className="text-sm font-bold">
                {h2h.menang} menang · {h2h.seri} seri · {h2h.kalah} kalah
              </p>
              <DaftarRiwayat riwayat={h2h.hasil} kosong="Belum pernah bertemu." />
            </Seksi>
          ) : null
        }
      />
    </KerangkaPublik>
  );
}
