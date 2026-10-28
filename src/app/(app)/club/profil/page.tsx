import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowSquareOutIcon, TrashIcon } from "@phosphor-icons/react/ssr";
import { BadgeLevel, LambangClub, PanelStatistik } from "@/components/ngebola/club";
import { FormClub } from "@/components/ngebola/form-club";
import { GaleriKelola } from "@/components/ngebola/galeri-kelola";
import { HeaderHalaman } from "@/components/ngebola/header";
import { StatusRegistrasi } from "@/components/ngebola/status-registrasi";
import { TombolKeluar } from "@/components/ngebola/tombol-keluar";
import { Button } from "@/components/ui/button";
import { LabelSeksi } from "@/components/ui/card";
import { hapusLogoAction } from "@/server/actions/club";
import { requireRole } from "@/server/authz";
import { clubMilik, MAKS_FOTO_GALERI } from "@/server/club";
import { galeriClub, statistikClub } from "@/server/queries/club";

export const metadata: Metadata = { title: "Club" };

export default async function Page() {
  const user = await requireRole("club_admin");
  const club = clubMilik(user.id);
  if (!club) redirect("/club/daftar-club");
  const s = statistikClub(club.id);

  return (
    <>
      <HeaderHalaman
        judul="Club"
        aksi={
          club.registrationStatus === "disetujui" && !club.suspendedAt ? (
            <Button asChild variant="garis" size="k">
              <Link href={`/profil-club/${club.slug}`}>
                <ArrowSquareOutIcon weight="bold" aria-hidden />
                Profil publik
              </Link>
            </Button>
          ) : null
        }
      />
      <StatusRegistrasi club={club} />

      <section className="flex flex-col gap-3 rounded-kartu border-2 border-hijau bg-krem-terang p-5">
        <div className="flex items-center gap-4">
          <LambangClub club={club} ukuran={72} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h2 className="text-xl leading-tight font-extrabold text-balance text-hijau">{club.name}</h2>
            <span className="text-[13px] text-teks-2">{club.area}, Pekanbaru</span>
            <BadgeLevel level={club.level} provisional={s.totalTerkonfirmasi < 5} />
          </div>
        </div>
        {club.logoPath && (
          <form action={hapusLogoAction} className="border-t-2 border-dashed border-nonaktif-tepi pt-3">
            <Button variant="teks" size="k" className="px-1 text-merah">
              <TrashIcon weight="bold" aria-hidden />
              Hapus logo
            </Button>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <LabelSeksi>Statistik</LabelSeksi>
        <PanelStatistik s={s} />
      </section>

      <section className="flex flex-col gap-3">
        <LabelSeksi>Ubah profil club</LabelSeksi>
        <div className="rounded-kartu border-2 border-nonaktif-tepi bg-krem-terang p-5">
          <FormClub awal={club} tombol={club.registrationStatus === "ditolak" ? "Kirim Ulang untuk Verifikasi" : "Simpan Profil"} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <LabelSeksi>Galeri</LabelSeksi>
        <GaleriKelola foto={galeriClub(club.id)} maks={MAKS_FOTO_GALERI} />
      </section>

      <TombolKeluar className="md:hidden" />
    </>
  );
}
