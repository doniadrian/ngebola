import type { Metadata } from "next";
import { IdentitasClub } from "@/components/ngebola/club";
import { DaftarAnggota } from "@/components/ngebola/daftar-anggota";
import { HeaderHalaman } from "@/components/ngebola/header";
import { FormKodeSkuad, KeluarSkuad } from "@/components/ngebola/skuad-pemain";
import { Banner } from "@/components/ngebola/umpan-balik";
import { Button } from "@/components/ui/button";
import { Card, LabelSeksi } from "@/components/ui/card";
import { batalkanPermintaanAction } from "@/server/actions/skuad";
import { requireRole } from "@/server/authz";
import { anggotaSkuad, permintaanPemain } from "@/server/queries/club";
import { clubAktifPemain } from "@/server/queries/identitas";

export const metadata: Metadata = { title: "Skuad" };

export default async function Page() {
  const user = await requireRole("player");
  const club = clubAktifPemain(user.id);

  if (!club) {
    const menunggu = permintaanPemain(user.id);
    return (
      <>
        <HeaderHalaman judul="Skuad" />
        {menunggu ? (
          <Banner
            jenis="tindakan"
            judul={`Menunggu persetujuan ${menunggu.clubName}`}
            aksi={
              <form action={batalkanPermintaanAction}>
                <Button variant="garis" size="k">Batalkan Permintaan</Button>
              </form>
            }
          >
            Admin club akan menyetujui permintaanmu. Kamu akan diberi tahu.
          </Banner>
        ) : (
          <Card>
            <LabelSeksi>Gabung skuad</LabelSeksi>
            <p className="text-sm text-teks-2">Satu pemain hanya bisa aktif di satu club. Minta kode skuad atau tautan undangan ke admin club-mu.</p>
            <FormKodeSkuad />
          </Card>
        )}
      </>
    );
  }

  const anggota = anggotaSkuad(club.id, "aktif");
  return (
    <>
      <HeaderHalaman judul="Skuad" />
      <Card>
        <IdentitasClub club={club} ukuran={56} tautan={club.registrationStatus === "disetujui"} />
      </Card>
      <section className="flex flex-col gap-3">
        <LabelSeksi>Anggota · {anggota.length}</LabelSeksi>
        <DaftarAnggota anggota={anggota} jersey={club.jerseyHome} kosong="Belum ada anggota lain." />
      </section>
      <KeluarSkuad namaClub={club.name} />
    </>
  );
}
