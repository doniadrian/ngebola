import type { Metadata } from "next";
import { FormPengaturan } from "@/components/ngebola/form-pengaturan";
import { HeaderHalaman } from "@/components/ngebola/header";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/server/authz";
import { bacaPengaturan } from "@/server/platform";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function Page() {
  await requireRole("platform_admin");
  return (
    <>
      <HeaderHalaman judul="Pengaturan" kembali="/platform/lainnya" />
      <p className="text-sm text-teks-2">Parameter berlaku untuk hasil berikutnya; rating yang sudah dihitung tidak diubah. Tenggat (72 jam respons, 48 jam hasil, 24 jam batal mendadak) mengikuti PRD.</p>
      <Card>
        <FormPengaturan awal={bacaPengaturan().map(({ key, label, nilai, min, max }) => ({ key, label, nilai, min, max }))} />
      </Card>
    </>
  );
}
