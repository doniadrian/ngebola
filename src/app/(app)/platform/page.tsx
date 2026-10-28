import { and, count, eq, isNull } from "drizzle-orm";
import { HeaderBeranda } from "@/components/ngebola/header";
import { PerluDilakukan, TataDashboard, type Tugas } from "@/components/ngebola/perlu-dilakukan";
import { LabelSeksi } from "@/components/ui/card";
import { db } from "@/db";
import { clubs, disputes, matches, moderationFlags, reports } from "@/db/schema";
import { LABEL_STATUS_MATCH, STATUS_MATCH } from "@/db/enums";
import { requireRole } from "@/server/authz";
import { identitas } from "@/server/queries/identitas";

const hitung = (n: { n: number }[]) => n[0]?.n ?? 0;

export default async function Page() {
  const user = await requireRole("platform_admin");
  const antrean = hitung(db.select({ n: count() }).from(clubs).where(eq(clubs.registrationStatus, "diajukan")).all());
  const sengketa = hitung(db.select({ n: count() }).from(disputes).where(isNull(disputes.decidedAt)).all());
  const laporan = hitung(db.select({ n: count() }).from(reports).where(eq(reports.status, "terbuka")).all());
  const flag = hitung(db.select({ n: count() }).from(moderationFlags).where(eq(moderationFlags.status, "terbuka")).all());
  const totalClub = hitung(db.select({ n: count() }).from(clubs).where(and(eq(clubs.registrationStatus, "disetujui"), isNull(clubs.suspendedAt))).all());
  const perStatus = db.select({ status: matches.status, n: count() }).from(matches).groupBy(matches.status).all();

  const tugas: Tugas[] = [
    ...(antrean ? [{ key: "verifikasi", judul: "Verifikasi club", sub: "Registrasi menunggu keputusan", href: "/platform/verifikasi", jumlah: antrean, mendesak: true }] : []),
    ...(sengketa ? [{ key: "sengketa", judul: "Sengketa terbuka", sub: "Putuskan dalam 3 hari kerja", href: "/platform/sengketa", jumlah: sengketa, mendesak: true }] : []),
    ...(laporan ? [{ key: "laporan", judul: "Laporan pengguna", href: "/platform/laporan", jumlah: laporan }] : []),
    ...(flag ? [{ key: "flag", judul: "Pola mencurigakan", sub: "Anti-manipulasi rating", href: "/platform/laporan", jumlah: flag }] : []),
  ];

  return (
    <>
      <HeaderBeranda identitas={identitas(user)} notifHref="/platform/notifikasi" />
      <TataDashboard tindakan={<PerluDilakukan tugas={tugas} judul="Antrean" />}>
        <section className="flex flex-col gap-3">
          <LabelSeksi>Ringkasan</LabelSeksi>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Club aktif", totalClub],
              ["Antrean verifikasi", antrean],
              ["Sengketa terbuka", sengketa],
              ["Laporan terbuka", laporan],
            ].map(([l, n]) => (
              <div key={l} className="flex flex-col gap-0.5 rounded-besar border-2 border-nonaktif-tepi bg-krem-terang px-3.5 py-3">
                <dt className="text-xs font-bold text-teks-2">{l}</dt>
                <dd className="text-[22px] font-extrabold text-hijau">{n}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="flex flex-col gap-3">
          <LabelSeksi>Match per status</LabelSeksi>
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {STATUS_MATCH.filter((s) => s !== "draf").map((s) => (
              <li key={s} className="flex items-center justify-between gap-2 rounded-tombol border-2 border-nonaktif-tepi bg-krem-terang px-3 py-2 text-sm">
                <span className="min-w-0 truncate text-teks-2">{LABEL_STATUS_MATCH[s]}</span>
                <span className="font-extrabold tabular-nums">{perStatus.find((p) => p.status === s)?.n ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>
      </TataDashboard>
    </>
  );
}
