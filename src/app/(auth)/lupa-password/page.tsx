import type { Metadata } from "next";
import { KerangkaTamu } from "@/components/ngebola/kerangka-tamu";
import { redirectIfSignedIn } from "@/server/authz";
import { FormLupa } from "./form-lupa";

export const metadata: Metadata = { title: "Lupa password" };

export default async function Page() {
  await redirectIfSignedIn();
  return (
    <KerangkaTamu ringkas judul="Lupa password" sub="Masukkan email akunmu. Kami kirim tautan untuk membuat password baru.">
      <FormLupa />
    </KerangkaTamu>
  );
}
