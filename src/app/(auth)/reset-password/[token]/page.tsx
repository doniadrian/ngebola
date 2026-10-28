import type { Metadata } from "next";
import Link from "next/link";
import { KerangkaTamu } from "@/components/ngebola/kerangka-tamu";
import { Banner } from "@/components/ngebola/umpan-balik";
import { Button } from "@/components/ui/button";
import { isResetTokenValid } from "@/server/auth/service";
import { FormReset } from "./form-reset";

export const metadata: Metadata = { title: "Password baru", referrer: "no-referrer" };

export default async function Page({ params }: PageProps<"/reset-password/[token]">) {
  const { token } = await params;
  if (!isResetTokenValid(token)) {
    return (
      <KerangkaTamu ringkas judul="Tautan tidak berlaku">
        <Banner jenis="tindakan" judul="Tautan sudah kedaluwarsa atau sudah dipakai">
          Tautan atur ulang hanya berlaku 30 menit dan sekali pakai. Minta tautan baru, ya.
        </Banner>
        <Button asChild size="b" className="w-full">
          <Link href="/lupa-password">Minta Tautan Baru</Link>
        </Button>
      </KerangkaTamu>
    );
  }
  return (
    <KerangkaTamu ringkas judul="Buat password baru" sub="Setelah disimpan, semua perangkat yang sedang masuk akan dikeluarkan.">
      <FormReset token={token} />
    </KerangkaTamu>
  );
}
