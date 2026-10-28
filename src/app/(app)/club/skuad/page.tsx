import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/ssr";
import { DaftarAnggota } from "@/components/ngebola/daftar-anggota";
import { HeaderHalaman } from "@/components/ngebola/header";
import { KeluarkanAnggota, PutuskanPermintaan, SalinKode, TautanUndangan } from "@/components/ngebola/skuad-admin";
import { StatusRegistrasi } from "@/components/ngebola/status-registrasi";
import { Hitungan } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, LabelSeksi } from "@/components/ui/card";
import { gantiKodeAction, cabutUndanganAction } from "@/server/actions/skuad";
import { requireRole } from "@/server/authz";
import { clubMilik } from "@/server/club";
import { anggotaSkuad } from "@/server/queries/club";

export const metadata: Metadata = { title: "Skuad" };

export default async function Page() {
  const user = await requireRole("club_admin");
  const club = clubMilik(user.id);
  if (!club) redirect("/club/daftar-club");
  const aktif = anggotaSkuad(club.id, "aktif");
  const permintaan = anggotaSkuad(club.id, "diajukan");
  const terbuka = club.registrationStatus !== "ditolak" && !club.suspendedAt;

  return (
    <>
      <HeaderHalaman judul="Skuad">
        <p className="text-sm text-teks-2">Jumlah pemain siap di tiap match dihitung dari konfirmasi ikut anggota skuad.</p>
      </HeaderHalaman>
      <StatusRegistrasi club={club} />

      {terbuka && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <LabelSeksi>Kode skuad</LabelSeksi>
            <p className="font-mono text-[32px] leading-none font-extrabold tracking-[.2em] text-hijau" aria-label={`Kode skuad ${club.squadCode.split("").join(" ")}`}>
              {club.squadCode}
            </p>
            <p className="text-[13px] text-teks-2">Pemain memasukkan kode ini di tab Skuad, lalu kamu menyetujuinya.</p>
            <div className="flex flex-wrap gap-3">
              <SalinKode kode={club.squadCode} />
              <form action={gantiKodeAction}>
                <Button variant="teks" size="k" className="px-2">
                  <ArrowsClockwiseIcon weight="bold" aria-hidden />
                  Ganti kode
                </Button>
              </form>
            </div>
          </Card>
          <Card>
            <LabelSeksi>Tautan undangan</LabelSeksi>
            <TautanUndangan namaClub={club.name} />
            <form action={cabutUndanganAction}>
              <Button variant="teks" size="k" className="px-0">
                Cabut semua tautan aktif
              </Button>
            </form>
          </Card>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <LabelSeksi className="flex items-center gap-2">
          Minta gabung <Hitungan jumlah={permintaan.length} label={`${permintaan.length} permintaan menunggu`} />
        </LabelSeksi>
        <DaftarAnggota
          anggota={permintaan}
          jersey={club.jerseyHome}
          kosong="Tidak ada permintaan yang menunggu."
          aksi={(a) => <PutuskanPermintaan membershipId={a.membershipId} nama={a.name} />}
        />
      </section>

      <section className="flex flex-col gap-3">
        <LabelSeksi>Anggota · {aktif.length}</LabelSeksi>
        <DaftarAnggota
          anggota={aktif}
          jersey={club.jerseyHome}
          kosong="Belum ada anggota. Bagikan kode atau tautan undangan ke pemainmu."
          aksi={(a) => <KeluarkanAnggota membershipId={a.membershipId} nama={a.name} />}
        />
      </section>
    </>
  );
}
