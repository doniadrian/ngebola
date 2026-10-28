"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Field, propsKolom } from "@/components/ngebola/field";
import { KolomPassword } from "@/components/ngebola/kolom-password";
import { TombolKirim } from "@/components/ngebola/tombol-kirim";
import { Banner } from "@/components/ngebola/umpan-balik";
import { Input } from "@/components/ui/input";
import { masukAction, type FormState } from "@/server/actions/auth";

export function FormMasuk({ lanjut }: { lanjut?: string }) {
  const [state, action] = useActionState(masukAction, {} as FormState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-[18px]">
      {lanjut && <input type="hidden" name="lanjut" value={lanjut} />}
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <Field id="email" label="Email" error={e.email}>
        <Input {...propsKolom("email", e.email)} type="email" autoComplete="email" inputMode="email" placeholder="nama@email.com" defaultValue={state.values?.email} required />
      </Field>
      <Field id="password" label="Password" error={e.password}>
        <KolomPassword {...propsKolom("password", e.password)} autoComplete="current-password" required />
      </Field>
      <Link href="/lupa-password" className="-mt-1 self-end text-sm font-bold text-hijau underline decoration-2 underline-offset-4 hover:text-hijau-tua">
        Lupa password?
      </Link>
      <TombolKirim size="b" className="w-full">
        Masuk
        <ArrowRightIcon aria-hidden />
      </TombolKirim>
      <p className="text-center text-xs text-teks-2">
        Dengan masuk kamu menyetujui <Link href="/syarat-layanan" className="font-bold text-hijau underline underline-offset-2">Syarat</Link> & <Link href="/kebijakan-privasi" className="font-bold text-hijau underline underline-offset-2">Privasi</Link>.
      </p>
      <p className="text-center text-sm text-teks-2">
        Belum punya akun?{" "}
        <Link href={lanjut ? `/daftar?lanjut=${encodeURIComponent(lanjut)}` : "/daftar"} className="font-bold text-hijau underline decoration-2 underline-offset-4">
          Daftar di sini
        </Link>
      </p>
    </form>
  );
}
