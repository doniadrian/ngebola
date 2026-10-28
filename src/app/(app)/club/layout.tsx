import { KerangkaApp } from "@/components/ngebola/kerangka-app";
import { requireRole } from "@/server/authz";
import { identitas } from "@/server/queries/identitas";
import { jumlahNav } from "@/server/queries/nav";

export default async function Layout({ children }: LayoutProps<"/club">) {
  const user = await requireRole("club_admin");
  return (
    <KerangkaApp peran="club_admin" identitas={identitas(user)} jumlah={jumlahNav(user)}>
      {children}
    </KerangkaApp>
  );
}
