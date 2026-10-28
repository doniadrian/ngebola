import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatTanggal } from "@/lib/waktu"
import { Banner } from "./umpan-balik"

type Club = { registrationStatus: "diajukan" | "disetujui" | "ditolak"; rejectionReason: string | null; suspendedAt: Date | null; suspensionReason: string | null; updatedAt: Date }

/** Status registrasi/penangguhan club; tidak tampil bila club normal (disetujui & aktif). */
export function StatusRegistrasi({ club }: { club: Club }) {
  if (club.suspendedAt) {
    return (
      <Banner jenis="gagal" judul="Club ditangguhkan">
        {club.suspensionReason ? <>Alasan: <b>{club.suspensionReason}</b>. </> : null}Selama ditangguhkan, club tidak bisa membuat atau menerima match. Hubungi Admin platform.
      </Banner>
    )
  }
  if (club.registrationStatus === "diajukan") {
    return (
      <Banner jenis="tindakan" judul="Menunggu verifikasi">
        Dikirim {formatTanggal(club.updatedAt)}. Admin platform sedang memeriksa data club. Kamu akan diberi tahu lewat aplikasi dan email.
      </Banner>
    )
  }
  if (club.registrationStatus === "ditolak") {
    return (
      <Banner
        jenis="gagal"
        judul="Registrasi ditolak"
        aksi={
          <Button asChild variant="garis" size="k">
            <Link href="/club/daftar-club">Perbaiki & Ajukan Ulang</Link>
          </Button>
        }
      >
        Alasan: <b>{club.rejectionReason}</b>
      </Banner>
    )
  }
  return null
}
