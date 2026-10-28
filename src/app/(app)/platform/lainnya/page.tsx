import type { Metadata } from "next";
import Link from "next/link";
import { CaretRightIcon, FlagIcon, GearIcon, ListMagnifyingGlassIcon, ShieldIcon, UsersIcon } from "@phosphor-icons/react/ssr";
import { HeaderHalaman } from "@/components/ngebola/header";
import { TombolKeluar } from "@/components/ngebola/tombol-keluar";
import { Hitungan } from "@/components/ui/badge";
import { requireRole } from "@/server/authz";
import { jumlahNav } from "@/server/queries/nav";

export const metadata: Metadata = { title: "Lainnya" };

const MENU = [
  { href: "/platform/club", label: "Semua club", sub: "Cari, tangguhkan, peringatan, koreksi data", Ikon: ShieldIcon },
  { href: "/platform/laporan", label: "Laporan & moderasi", sub: "Laporan pengguna & pola mencurigakan", Ikon: FlagIcon, hitung: true },
  { href: "/platform/pengguna", label: "Pengguna", sub: "Cari akun, nonaktifkan/aktifkan", Ikon: UsersIcon },
  { href: "/platform/audit", label: "Log audit", sub: "Siapa, kapan, apa, alasan", Ikon: ListMagnifyingGlassIcon },
  { href: "/platform/pengaturan", label: "Pengaturan", sub: "Parameter rating & batas match terbuka", Ikon: GearIcon },
];

export default async function Page() {
  const user = await requireRole("platform_admin");
  const jumlah = jumlahNav(user)["/platform/lainnya"] ?? 0;
  return (
    <>
      <HeaderHalaman judul="Lainnya" />
      <ul className="grid gap-3 md:grid-cols-2">
        {MENU.map(({ href, label, sub, Ikon, hitung }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 rounded-kartu border-2 border-hijau bg-krem-terang p-4 shadow-keras transition-[translate,box-shadow] duration-[240ms] ease-pegas outline-none tekan:duration-60 tekan:ease-out tekan:translate-y-1 tekan:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-hijau">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-kecil border-2 border-tinta bg-emas text-tinta">
                <Ikon weight="bold" className="size-5" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-extrabold">{label}</span>
                <span className="text-[13px] text-teks-2">{sub}</span>
              </span>
              {hitung && <Hitungan jumlah={jumlah} />}
              <CaretRightIcon weight="bold" className="size-5 text-hijau" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <TombolKeluar className="md:hidden" />
    </>
  );
}
