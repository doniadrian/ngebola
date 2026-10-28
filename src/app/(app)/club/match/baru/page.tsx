import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormMatchBaru } from "@/components/ngebola/form-match-baru";
import { HeaderHalaman } from "@/components/ngebola/header";
import { StatusRegistrasi } from "@/components/ngebola/status-registrasi";
import { Banner } from "@/components/ngebola/umpan-balik";
import { requireRole } from "@/server/authz";
import { bolehBertanding, clubMilik } from "@/server/club";
import { maksMatchTerbuka } from "@/server/match";
import { matchClub } from "@/server/queries/match";
import { opsiLapangan } from "@/server/queries/venue";

export const metadata: Metadata = { title: "Buat match terbuka" };

export default async function Page() {
  const user = await requireRole("club_admin");
  const club = clubMilik(user.id);
  if (!club) redirect("/club/daftar-club");
  const aktif = matchClub(club.id, ["terbuka"]).filter((m) => m.match.creatorClubId === club.id).length;
  const maks = maksMatchTerbuka();

  return (
    <>
      <HeaderHalaman judul="Match terbuka baru" kembali="/club/cari-lawan" />
      {!bolehBertanding(club) ? (
        <StatusRegistrasi club={club} />
      ) : aktif >= maks ? (
        <Banner jenis="tindakan" judul={`Sudah ${maks} match terbuka aktif`}>Tutup salah satu match terbuka dulu sebelum membuat yang baru.</Banner>
      ) : (
        <>
          <p className="text-sm text-teks-2">
            Match terbuka tampil di Cari Lawan dan halaman publik. Club lain bisa menerima salah satu opsi jadwal atau menawar balik. Aktif: {aktif}/{maks}.
          </p>
          <FormMatchBaru jenis="terbuka" venues={opsiLapangan()} areaClub={club.area} levelClub={club.level} />
        </>
      )}
    </>
  );
}
