import type { Metadata } from "next";
import { asc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { HeaderHalaman } from "@/components/ngebola/header";
import { BarisJadwal } from "@/components/ngebola/match-ui";
import { KartuKosong } from "@/components/ngebola/umpan-balik";
import { LabelSeksi } from "@/components/ui/card";
import { db } from "@/db";
import { clubs, disputes, matches } from "@/db/schema";
import { LABEL_FORMAT } from "@/db/enums";
import { formatJadwal } from "@/lib/waktu";
import { requireRole } from "@/server/authz";

export const metadata: Metadata = { title: "Sengketa" };

const a = alias(clubs, "a");
const b = alias(clubs, "b");

export default async function Page() {
  await requireRole("platform_admin");
  const baris = (terbuka: boolean) =>
    db
      .select({ d: disputes, m: matches, a: a.name, b: b.name })
      .from(disputes)
      .innerJoin(matches, eq(matches.id, disputes.matchId))
      .innerJoin(a, eq(a.id, matches.creatorClubId))
      .innerJoin(b, eq(b.id, matches.opponentClubId))
      .where(terbuka ? isNull(disputes.decidedAt) : undefined)
      .orderBy(asc(disputes.openedAt))
      .all()
      .filter((r) => terbuka || r.d.decidedAt);
  const terbuka = baris(true);
  const selesai = baris(false).slice(-20).reverse();
  const now = new Date();

  return (
    <>
      <HeaderHalaman judul="Sengketa">
        <p className="text-sm text-teks-2">Putuskan dalam 3 hari kerja sejak bukti lengkap. Bukti dari kedua pihak dibuka 48 jam.</p>
      </HeaderHalaman>
      <section className="flex flex-col gap-3">
        <LabelSeksi>Menunggu keputusan · {terbuka.length}</LabelSeksi>
        {terbuka.length ? (
          <ul className="flex flex-col gap-3">
            {terbuka.map((r) => (
              <BarisJadwal
                key={r.d.id}
                href={`/platform/sengketa/${r.m.id}`}
                at={r.m.scheduledAt}
                lawan={`${r.a} vs ${r.b}`}
                sub={`${LABEL_FORMAT[r.m.format]} · dibuka ${formatJadwal(r.d.openedAt)}`}
                status="sengketa"
                tambahan={<span className="text-xs font-bold text-emas-tua">{r.d.evidenceDeadline > now ? `Bukti s.d. ${formatJadwal(r.d.evidenceDeadline)}` : "Bukti lengkap — siap diputus"}</span>}
              />
            ))}
          </ul>
        ) : (
          <KartuKosong judul="Tidak ada sengketa">Sengketa hasil match yang perlu diputus akan muncul di sini.</KartuKosong>
        )}
      </section>
      {selesai.length > 0 && (
        <section className="flex flex-col gap-3">
          <LabelSeksi>Sudah diputus</LabelSeksi>
          <ul className="flex flex-col gap-3">
            {selesai.map((r) => (
              <BarisJadwal key={r.d.id} href={`/platform/sengketa/${r.m.id}`} at={r.m.scheduledAt} lawan={`${r.a} vs ${r.b}`} sub={`Diputus ${formatJadwal(r.d.decidedAt!)} · ${r.d.decision}`} status={r.m.status} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
