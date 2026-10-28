import { KerangkaApp } from "@/components/ngebola/kerangka-app";
import { requireRole } from "@/server/authz";
import { identitas } from "@/server/queries/identitas";
import { jumlahNav } from "@/server/queries/nav";

export default async function Layout({ children }: LayoutProps<"/platform">) {
  const user = await requireRole("platform_admin");
  return (
    <KerangkaApp peran="platform_admin" identitas={identitas(user)} jumlah={jumlahNav(user)}>
      {children}
    </KerangkaApp>
  );
}
