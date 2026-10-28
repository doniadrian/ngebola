import { PEMAIN_AKTIF } from "@/lib/fitur";
import type { Metadata } from "next";
import { KerangkaTamu } from "@/components/ngebola/kerangka-tamu";
import { redirectIfSignedIn } from "@/server/authz";
import { FormDaftar } from "./form-daftar";

export const metadata: Metadata = { title: "Daftar" };

export default async function Page({ searchParams }: PageProps<"/daftar">) {
  await redirectIfSignedIn();
  const { lanjut, peran } = await searchParams;
  return (
    <KerangkaTamu ringkas judul="Daftar akun">
      <FormDaftar pemain={PEMAIN_AKTIF} lanjut={typeof lanjut === "string" ? lanjut : undefined} peran={peran === "player" || peran === "club_admin" ? peran : undefined} />
    </KerangkaTamu>
  );
}
