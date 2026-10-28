"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, propsKolom } from "@/components/ngebola/field";
import { TombolKirim } from "@/components/ngebola/tombol-kirim";
import { Banner } from "@/components/ngebola/umpan-balik";
import { Input } from "@/components/ui/input";
import { lupaPasswordAction, type FormState } from "@/server/actions/auth";

export function FormLupa() {
  const [state, action] = useActionState(lupaPasswordAction, {} as FormState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-[18px]">
      {state.ok && (
        <Banner jenis="saran" judul="Cek kotak masukmu">
          {state.message} Tidak ada? Cek folder Spam.
        </Banner>
      )}
      <Field id="email" label="Email" error={e.email}>
        <Input {...propsKolom("email", e.email)} type="email" autoComplete="email" inputMode="email" placeholder="nama@email.com" defaultValue={state.values?.email} required />
      </Field>
      <TombolKirim size="b" className="w-full">
        {state.ok ? "Kirim Ulang Tautan" : "Kirim Tautan"}
      </TombolKirim>
      <Link href="/masuk" className="self-center text-sm font-bold text-hijau underline decoration-2 underline-offset-4">
        Kembali ke halaman masuk
      </Link>
    </form>
  );
}
