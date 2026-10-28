import type { Metadata } from "next";
import { KerangkaTamu } from "@/components/ngebola/kerangka-tamu";
import { Banner } from "@/components/ngebola/umpan-balik";
import { redirectIfSignedIn } from "@/server/authz";
import { FormMasuk } from "./form-masuk";
import { PanelDemo } from "@/components/ngebola/panel-demo";

export const metadata: Metadata = { title: "Masuk" };

export default async function Page({ searchParams }: PageProps<"/masuk">) {
  await redirectIfSignedIn();
  const { reset, lanjut, akun } = await searchParams;
  return (
    <KerangkaTamu judul="Masuk ke Ngebola" sub="Cari lawan sparring & atur jadwal club, tanpa ribet di grup WA.">
      {reset === "berhasil" && <Banner jenis="saran" judul="Password baru tersimpan">Silakan masuk dengan password barumu.</Banner>}
      {akun === "dihapus" && <Banner jenis="saran" judul="Akun dihapus">Data pribadimu sudah dihapus. Terima kasih sudah bermain di Ngebola.</Banner>}
      <FormMasuk lanjut={typeof lanjut === "string" ? lanjut : undefined} />
      <PanelDemo />
    </KerangkaTamu>
  );
}
