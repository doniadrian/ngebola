import Link from "next/link";
import { PlusIcon, ShieldPlusIcon } from "@phosphor-icons/react/ssr";
import { LimaLaga, PanelStatistik } from "@/components/ngebola/club";
import { HeaderBeranda } from "@/components/ngebola/header";
import { PerluDilakukan, TataDashboard, type Tugas } from "@/components/ngebola/perlu-dilakukan";
import { StatusRegistrasi } from "@/components/ngebola/status-registrasi";
import { Banner, KartuKosong } from "@/components/ngebola/umpan-balik";
import { Button } from "@/components/ui/button";
import { LabelSeksi } from "@/components/ui/card";
import { requireRole } from "@/server/authz";
import { clubMilik } from "@/server/club";
import { anggotaSkuad, statistikClub } from "@/server/queries/club";
import { identitas } from "@/server/queries/identitas";
import { BerandaMatch, tugasMatchClub } from "./beranda-match";

export default async function Page({ searchParams }: PageProps<"/club">) {
  const user = await requireRole("club_admin");
  const club = clubMilik(user.id);
  const { registrasi } = await searchParams;
  const id = identitas(user);

  if (!club) {
    return (
      <>
        <HeaderBeranda identitas={id} notifHref="/club/notifikasi" />
        <KartuKosong
          judul="Belum ada club"
          aksi={
            <Button asChild size="b">
              <Link href="/club/daftar-club">
                <ShieldPlusIcon weight="bold" aria-hidden />
                Daftarkan Club
              </Link>
            </Button>
          }
        >
          Daftarkan club kamu supaya bisa mulai mencari lawan sparring. Admin platform memverifikasi data club sebelum club bisa bertanding.
        </KartuKosong>
      </>
    );
  }

  const permintaan = anggotaSkuad(club.id, "diajukan");
  const tugas: Tugas[] = [
    ...tugasMatchClub(club.id),
    ...(permintaan.length ? [{ key: "skuad", judul: "Permintaan gabung skuad", sub: permintaan.map((p) => p.name).slice(0, 3).join(", "), href: "/club/skuad", jumlah: permintaan.length }] : []),
  ];
  const s = statistikClub(club.id);

  return (
    <>
      <HeaderBeranda
        identitas={id}
        notifHref="/club/notifikasi"
        aksi={
          club.registrationStatus === "disetujui" && !club.suspendedAt ? (
            <Button asChild size="k">
              <Link href="/club/match/baru">
                <PlusIcon weight="bold" aria-hidden />
                Match baru
              </Link>
            </Button>
          ) : null
        }
      />
      {registrasi === "diajukan" && (
        <Banner jenis="saran" judul="Registrasi terkirim">
          Admin platform akan memeriksa data club. Kamu akan diberi tahu lewat aplikasi dan email.
        </Banner>
      )}
      <StatusRegistrasi club={club} />
      <TataDashboard tindakan={<PerluDilakukan tugas={tugas} />}>
        <BerandaMatch club={club} />
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <LabelSeksi>Statistik club</LabelSeksi>
            <LimaLaga hasil={s.limaTerakhir} />
          </div>
          <PanelStatistik s={s} />
        </section>
      </TataDashboard>
    </>
  );
}
