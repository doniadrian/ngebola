import type { Metadata } from "next";
import { HalamanNotifikasi } from "@/components/ngebola/halaman-notifikasi";
import { requireRole } from "@/server/authz";

export const metadata: Metadata = { title: "Pemberitahuan" };

export default async function Page() {
  const user = await requireRole("platform_admin");
  return <HalamanNotifikasi user={user} kembali="/platform" />;
}
