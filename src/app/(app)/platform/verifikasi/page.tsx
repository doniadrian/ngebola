import type { Metadata } from "next";
import { EnvelopeSimpleIcon, PhoneIcon } from "@phosphor-icons/react/ssr";
import { BadgeLevel, LambangClub } from "@/components/ngebola/club";
import { HeaderHalaman } from "@/components/ngebola/header";
import { KeputusanRegistrasi } from "@/components/ngebola/keputusan-registrasi";
import { KartuKosong } from "@/components/ngebola/umpan-balik";
import { Card } from "@/components/ui/card";
import { formatTanggalPanjang, formatJam } from "@/lib/waktu";
import { requireRole } from "@/server/authz";
import { antreanVerifikasi } from "@/server/queries/club";

export const metadata: Metadata = { title: "Verifikasi club" };

export default async function Page() {
  await requireRole("platform_admin");
  const antrean = antreanVerifikasi();
  return (
    <>
      <HeaderHalaman judul="Verifikasi club">
        <p className="text-sm text-teks-2">Target: diputuskan dalam 1 hari kerja. Club belum bisa bertanding sebelum disetujui.</p>
      </HeaderHalaman>
      {antrean.length === 0 ? (
        <KartuKosong judul="Antrean verifikasi kosong">Club baru yang mengajukan registrasi akan muncul di sini.</KartuKosong>
      ) : (
        <ul className="flex flex-col gap-4">
          {antrean.map(({ club, adminName, adminEmail }) => (
            <li key={club.id}>
              <Card>
                <div className="flex items-start gap-4">
                  <LambangClub club={club} ukuran={56} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h2 className="text-lg font-extrabold">{club.name}</h2>
                    <p className="text-[13px] text-teks-2">
                      {club.area}, Pekanbaru{club.foundedYear ? ` · berdiri ${club.foundedYear}` : ""} · diajukan {formatTanggalPanjang(club.updatedAt)} {formatJam(club.updatedAt)}
                    </p>
                    <BadgeLevel level={club.level} />
                  </div>
                </div>
                {club.description && <p className="text-sm leading-relaxed text-teks-2">{club.description}</p>}
                <dl className="grid gap-2 rounded-besar bg-krem p-3.5 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold text-teks-2">Admin club</dt>
                    <dd className="font-bold">{adminName}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="sr-only">Kontak</dt>
                    <dd>
                      <a href={`mailto:${adminEmail}`} className="flex items-center gap-1.5 font-bold text-hijau underline underline-offset-4">
                        <EnvelopeSimpleIcon weight="bold" className="size-4" aria-hidden />
                        {adminEmail}
                      </a>
                    </dd>
                    {club.contactPhone && (
                      <dd>
                        <a href={`tel:${club.contactPhone}`} className="flex items-center gap-1.5 font-bold text-hijau underline underline-offset-4">
                          <PhoneIcon weight="bold" className="size-4" aria-hidden />
                          {club.contactPhone}
                        </a>
                      </dd>
                    )}
                  </div>
                </dl>
                <KeputusanRegistrasi clubId={club.id} nama={club.name} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
