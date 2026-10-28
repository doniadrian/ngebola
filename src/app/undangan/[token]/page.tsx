import type { Metadata } from "next";
import Link from "next/link";
import { IdentitasClub } from "@/components/ngebola/club";
import { KerangkaTamu } from "@/components/ngebola/kerangka-tamu";
import { FormUndangan } from "@/components/ngebola/skuad-pemain";
import { Banner } from "@/components/ngebola/umpan-balik";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/server/auth/session";
import { BERANDA_PERAN } from "@/server/authz";
import { clubAktifPemain } from "@/server/queries/identitas";
import { clubDariUndangan } from "@/server/skuad";

export const metadata: Metadata = { title: "Undangan skuad", referrer: "no-referrer" };

export default async function Page({ params }: PageProps<"/undangan/[token]">) {
  const { token } = await params;
  const club = clubDariUndangan(token);
  const user = await getCurrentUser();

  if (!club || club.registrationStatus === "ditolak" || club.suspendedAt) {
    return (
      <KerangkaTamu ringkas judul="Undangan tidak berlaku">
        <Banner jenis="tindakan">Tautan undangan sudah kedaluwarsa atau dicabut. Minta tautan baru atau kode skuad ke admin club.</Banner>
        <Button asChild variant="garis" className="w-full">
          <Link href={user ? BERANDA_PERAN[user.role] : "/"}>Kembali</Link>
        </Button>
      </KerangkaTamu>
    );
  }

  const lanjut = `/undangan/${token}`;
  return (
    <KerangkaTamu ringkas judul="Undangan gabung skuad">
      <Card>
        <IdentitasClub club={club} ukuran={56} sub={`${club.area}, Pekanbaru`} />
      </Card>
      {!user ? (
        <>
          <p className="text-[15px] text-teks-2">Buat akun Pemain atau masuk dulu. Setelah itu kamu bisa minta gabung, lalu admin club menyetujui.</p>
          <Button asChild size="b" className="w-full">
            <Link href={`/daftar?peran=player&lanjut=${encodeURIComponent(lanjut)}`}>Daftar sebagai Pemain</Link>
          </Button>
          <Button asChild variant="garis" className="w-full">
            <Link href={`/masuk?lanjut=${encodeURIComponent(lanjut)}`}>Sudah punya akun? Masuk</Link>
          </Button>
        </>
      ) : user.role !== "player" ? (
        <Banner jenis="tindakan">Tautan ini untuk akun Pemain. Kamu masuk sebagai {user.role === "club_admin" ? "Admin club" : "Admin platform"}.</Banner>
      ) : clubAktifPemain(user.id) ? (
        <Banner jenis="tindakan">Kamu sudah anggota aktif sebuah club. Keluar dulu dari skuad lama sebelum gabung club lain.</Banner>
      ) : (
        <FormUndangan token={token} namaClub={club.name} />
      )}
    </KerangkaTamu>
  );
}
