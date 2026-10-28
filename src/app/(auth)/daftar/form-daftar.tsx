"use client";

import { useActionState } from "react";
import Link from "next/link";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Field, idPesan, propsKolom } from "@/components/ngebola/field";
import { KolomPassword } from "@/components/ngebola/kolom-password";
import { PilihTanggal } from "@/components/ngebola/pilih-tanggal";
import { TombolKirim } from "@/components/ngebola/tombol-kirim";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { UMUR_MINIMAL } from "@/lib/validasi";
import { daftarAction, type FormState } from "@/server/actions/auth";

// Form dipadatkan agar muat tanpa banyak scroll di HP: peran dua kolom, petunjuk jadi placeholder, jarak rapat.
const KOMPAK = "gap-1.5";
const INPUT = "h-12";

export function FormDaftar({ lanjut, peran, pemain }: { lanjut?: string; peran?: "player" | "club_admin"; pemain: boolean }) {
  const [state, action] = useActionState(daftarAction, {} as FormState);
  const e = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const now = new Date();
  const batasLahir = new Date(now.getFullYear() - UMUR_MINIMAL, now.getMonth(), now.getDate());

  return (
    <form action={action} noValidate className="flex flex-col gap-3">
      {lanjut && <input type="hidden" name="lanjut" value={lanjut} />}
      {!pemain && <input type="hidden" name="role" value="club_admin" />}
      {pemain && <fieldset className="flex flex-col gap-1.5" aria-describedby={e.role ? idPesan("role") : undefined}>
        <legend className="mb-1.5 text-sm font-bold">Daftar sebagai</legend>
        <RadioGroup name="role" defaultValue={v.role || peran} aria-invalid={e.role ? true : undefined} required className="grid-cols-2 gap-2">
          <RadioCard value="club_admin" judul="Admin club" keterangan="Kelola club" className="px-3 py-2.5" aria-invalid={e.role ? true : undefined} />
          <RadioCard value="player" judul="Pemain" keterangan="Gabung skuad" className="px-3 py-2.5" aria-invalid={e.role ? true : undefined} />
        </RadioGroup>
        {e.role && (
          <p id={idPesan("role")} role="alert" className="flex items-start gap-1.5 text-[13px] font-bold text-merah">
            <WarningCircleIcon className="mt-px size-4 shrink-0" aria-hidden />
            {e.role}
          </p>
        )}
      </fieldset>}

      <Field id="name" label="Nama lengkap" error={e.name} className={KOMPAK}>
        <Input {...propsKolom("name", e.name)} className={INPUT} autoComplete="name" placeholder="mis. Dimas Pratama" defaultValue={v.name} required />
      </Field>
      <Field id="email" label="Email" error={e.email} className={KOMPAK}>
        <Input {...propsKolom("email", e.email)} className={INPUT} type="email" autoComplete="email" inputMode="email" placeholder="nama@email.com" defaultValue={v.email} required />
      </Field>
      <Field id="birthDate" label={`Tanggal lahir (min. ${UMUR_MINIMAL} tahun)`} error={e.birthDate} className={KOMPAK}>
        <PilihTanggal
          id="birthDate"
          name="birthDate"
          defaultValue={v.birthDate}
          placeholder="Pilih tanggal lahir"
          dropdownTahun
          dariTahun={now.getFullYear() - 90}
          sampaiTahun={now.getFullYear() - UMUR_MINIMAL}
          disabled={{ after: batasLahir }}
          invalid={!!e.birthDate}
          describedBy={idPesan("birthDate")}
          kompak
        />
      </Field>
      <Field id="password" label="Password" error={e.password} className={KOMPAK}>
        <KolomPassword {...propsKolom("password", e.password)} className={INPUT} autoComplete="new-password" placeholder="Minimal 10 karakter" required />
      </Field>
      <Field id="confirmPassword" label="Ulangi password" error={e.confirmPassword} className={KOMPAK}>
        <KolomPassword {...propsKolom("confirmPassword", e.confirmPassword)} className={INPUT} autoComplete="new-password" required />
      </Field>

      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-3 text-[13px] leading-snug text-teks-2">
          <Checkbox name="setuju" defaultChecked={v.setuju === "on"} aria-invalid={e.setuju ? true : undefined} aria-describedby={e.setuju ? idPesan("setuju") : undefined} className="mt-0.5" />
          <span>
            Saya berusia {UMUR_MINIMAL}+ dan menyetujui{" "}
            <Link href="/syarat-layanan" target="_blank" className="font-bold text-hijau underline underline-offset-2">
              Syarat Layanan
            </Link>{" "}
            &{" "}
            <Link href="/kebijakan-privasi" target="_blank" className="font-bold text-hijau underline underline-offset-2">
              Kebijakan Privasi
            </Link>
            .
          </span>
        </label>
        {e.setuju && (
          <p id={idPesan("setuju")} role="alert" className="flex items-start gap-1.5 text-[13px] font-bold text-merah">
            <WarningCircleIcon className="mt-px size-4 shrink-0" aria-hidden />
            {e.setuju}
          </p>
        )}
      </div>

      <TombolKirim size="b" className="mt-0.5 w-full">
        Buat Akun
      </TombolKirim>
      <p className="text-center text-sm text-teks-2">
        Sudah punya akun?{" "}
        <Link href={lanjut ? `/masuk?lanjut=${encodeURIComponent(lanjut)}` : "/masuk"} className="font-bold text-hijau underline decoration-2 underline-offset-4">
          Masuk
        </Link>
      </p>
    </form>
  );
}
