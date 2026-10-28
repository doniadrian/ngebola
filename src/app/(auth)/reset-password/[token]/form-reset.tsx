"use client";

import { useActionState } from "react";
import { Field, propsKolom } from "@/components/ngebola/field";
import { KolomPassword } from "@/components/ngebola/kolom-password";
import { TombolKirim } from "@/components/ngebola/tombol-kirim";
import { Banner } from "@/components/ngebola/umpan-balik";
import { resetPasswordAction, type FormState } from "@/server/actions/auth";

export function FormReset({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction.bind(null, token), {} as FormState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-[18px]">
      {state.error && <Banner jenis="gagal">{state.error}</Banner>}
      <Field id="password" label="Password baru" hint="10–128 karakter." error={e.password}>
        <KolomPassword {...propsKolom("password", e.password, true)} autoComplete="new-password" required />
      </Field>
      <Field id="confirmPassword" label="Ulangi password baru" error={e.confirmPassword}>
        <KolomPassword {...propsKolom("confirmPassword", e.confirmPassword)} autoComplete="new-password" required />
      </Field>
      <TombolKirim size="b" className="w-full">
        Simpan Password
      </TombolKirim>
    </form>
  );
}
