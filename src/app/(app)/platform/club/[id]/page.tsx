import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { LambangClub, PanelStatistik } from "@/components/ngebola/club";
import { DaftarMatchClub } from "@/components/ngebola/daftar-match-club";
import { DialogAlasan } from "@/components/ngebola/dialog-alasan";
import { FormKoreksiClub } from "@/components/ngebola/form-koreksi-club";
import { HeaderHalaman } from "@/components/ngebola/header";
import { Banner } from "@/components/ngebola/umpan-balik";
import { Card, LabelSeksi } from "@/components/ui/card";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/server/authz";
import { clubDariId, jumlahAnggota, statistikClub } from "@/server/queries/club";
import { matchClub } from "@/server/queries/match";

export const metadata: Metadata = { title: "Detail club" };

export default async function Page({ params }: PageProps<"/platform/club/[id]">) {
  await requireRole("platform_admin");
  const c = clubDariId((await params).id);
  if (!c) notFound();
  const admin = db.select({ name: users.name, email: users.email, status: users.status }).from(users).where(eq(users.id, c.adminUserId)).get();
  return (
    <>
      <HeaderHalaman judul="Detail club" kembali="/platform/club" />
      {c.suspendedAt && <Banner jenis="gagal" judul="Ditangguhkan">{c.suspensionReason}</Banner>}
      <Card>
        <div className="flex items-center gap-4">
          <LambangClub club={c} ukuran={64} />
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-xl font-extrabold text-hijau">{c.name}</h2>
            <p className="text-[13px] text-teks-2">
              {c.area} · {c.registrationStatus} · {jumlahAnggota(c.id)} anggota skuad
            </p>
            {c.registrationStatus === "disetujui" && !c.suspendedAt && (
              <Link href={`/profil-club/${c.slug}`} className="text-sm font-bold text-hijau underline underline-offset-4">
                Profil publik
              </Link>
            )}
          </div>
        </div>
        <dl className="grid gap-1 rounded-besar bg-krem p-3 text-sm">
          <dt className="text-xs font-bold text-teks-2">Admin club</dt>
          <dd>
            {admin?.name} · {admin?.email} · {c.contactPhone ?? "—"} · akun {admin?.status}
          </dd>
        </dl>
        <div className="flex flex-wrap justify-end gap-3">
          <DialogAlasan jenis="peringatan" targetId={c.id} pemicu="Kirim Peringatan" judul={`Peringatkan ${c.name}?`} deskripsi="Admin club menerima peringatan lewat aplikasi dan email." label="Kirim Peringatan" berhasil="Peringatan terkirim" />
          {c.suspendedAt ? (
            <DialogAlasan jenis="cabut" targetId={c.id} pemicu="Cabut Penangguhan" judul={`Cabut penangguhan ${c.name}?`} deskripsi="Club bisa membuat dan menerima match lagi." label="Cabut Penangguhan" berhasil="Penangguhan dicabut" />
          ) : (
            <DialogAlasan
              jenis="tangguhkan"
              targetId={c.id}
              pemicu="Tangguhkan"
              varianPemicu="bahaya"
              bahaya
              judul={`Tangguhkan ${c.name}?`}
              deskripsi="Club tidak bisa bertanding dan hilang dari halaman publik. Semua match terjadwal & ajakan aktifnya dibatalkan tanpa penalti bagi lawan."
              label="Ya, Tangguhkan"
              berhasil="Club ditangguhkan"
            />
          )}
        </div>
      </Card>
      <section className="flex flex-col gap-3">
        <LabelSeksi>Statistik</LabelSeksi>
        <PanelStatistik s={statistikClub(c.id)} />
      </section>
      <Card>
        <LabelSeksi>Koreksi data (dengan alasan)</LabelSeksi>
        <FormKoreksiClub clubId={c.id} awal={{ name: c.name, area: c.area, level: c.level }} />
      </Card>
      <section className="flex flex-col gap-3">
        <LabelSeksi>Riwayat match</LabelSeksi>
        <DaftarMatchClub items={matchClub(c.id).slice(0, 30)} clubId={c.id} kosong="Belum ada match." dasar="/platform/match" />
      </section>
    </>
  );
}
