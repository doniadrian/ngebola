import Link from "next/link";
import { UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { IdentitasClub } from "@/components/ngebola/club";
import { HeaderBeranda } from "@/components/ngebola/header";
import { Banner, KartuKosong } from "@/components/ngebola/umpan-balik";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/server/authz";
import { permintaanPemain } from "@/server/queries/club";
import { identitas } from "@/server/queries/identitas";
import { BerandaMatchPemain } from "./beranda-match";

export default async function Page() {
  const user = await requireRole("player");
  const id = identitas(user);
  const club = id.club;
  const menunggu = club ? null : permintaanPemain(user.id);

  return (
    <>
      <HeaderBeranda identitas={id} notifHref="/pemain/notifikasi" />
      {club ? (
        <>
          <BerandaMatchPemain userId={user.id} club={club} />
          <Card>
            <IdentitasClub club={club} ukuran={48} tautan={club.registrationStatus === "disetujui"} />
          </Card>
        </>
      ) : menunggu ? (
        <Banner jenis="tindakan" judul={`Menunggu persetujuan ${menunggu.clubName}`}>
          Setelah disetujui, jadwal match club-mu akan muncul di sini.
        </Banner>
      ) : (
        <KartuKosong
          judul="Belum gabung club"
          aksi={
            <Button asChild>
              <Link href="/pemain/skuad">
                <UsersThreeIcon weight="bold" aria-hidden />
                Gabung Skuad
              </Link>
            </Button>
          }
        >
          Masukkan kode skuad dari admin club-mu. Jadwal match berikutnya akan muncul di sini.
        </KartuKosong>
      )}
    </>
  );
}
