import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormClub } from "@/components/ngebola/form-club";
import { HeaderHalaman } from "@/components/ngebola/header";
import { TombolKeluar } from "@/components/ngebola/tombol-keluar";
import { Banner } from "@/components/ngebola/umpan-balik";
import { requireRole } from "@/server/authz";
import { clubMilik } from "@/server/club";

export const metadata: Metadata = { title: "Daftarkan club" };

/** Sesi registrasi club (A-04). Club Ditolak memperbaiki data di sini lalu otomatis diajukan ulang. */
export default async function Page() {
  const user = await requireRole("club_admin");
  const club = clubMilik(user.id);
  if (club && club.registrationStatus !== "ditolak") redirect("/club/profil");

  return (
    <>
      <HeaderHalaman judul={club ? "Perbaiki registrasi" : "Daftarkan club"} kembali="/club" />
      {club ? (
        <Banner jenis="tindakan" judul="Registrasi ditolak">
          Alasan: <b>{club.rejectionReason}</b>. Perbaiki data lalu kirim lagi untuk diverifikasi ulang.
        </Banner>
      ) : (
        <Banner jenis="saran">
          Satu akun Admin club mengelola satu club. Setelah dikirim, Admin platform memverifikasi data club (biasanya 1 hari kerja). Club belum bisa bertanding sebelum disetujui.
        </Banner>
      )}
      <FormClub awal={club ?? {}} tombol={club ? "Kirim Ulang untuk Verifikasi" : "Kirim untuk Verifikasi"} />
      {/* Tab Club mengarah ke sini selama belum punya club; di HP Keluar ada di tab Club. */}
      <TombolKeluar className="md:hidden" />
    </>
  );
}
