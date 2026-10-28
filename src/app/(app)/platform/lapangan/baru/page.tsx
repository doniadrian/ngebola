import type { Metadata } from "next";
import { FormLapangan } from "@/components/ngebola/form-lapangan";
import { HeaderHalaman } from "@/components/ngebola/header";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/server/authz";

export const metadata: Metadata = { title: "Tambah lapangan" };

export default async function Page() {
  await requireRole("platform_admin");
  return (
    <>
      <HeaderHalaman judul="Tambah lapangan" kembali="/platform/lapangan" />
      <Card>
        <FormLapangan id={null} awal={{ forMini: true }} />
      </Card>
    </>
  );
}
