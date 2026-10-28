import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatMatch } from "@/components/ngebola/chat-match";
import { FormKeputusanSengketa } from "@/components/ngebola/form-keputusan-sengketa";
import { HeaderHalaman } from "@/components/ngebola/header";
import { LaporanMatch } from "@/components/ngebola/laporan-match";
import { InfoLapangan, KepalaMatch } from "@/components/ngebola/match-ui";
import { Banner } from "@/components/ngebola/umpan-balik";
import { Card, LabelSeksi } from "@/components/ui/card";
import { formatJadwal } from "@/lib/waktu";
import { requireRole } from "@/server/authz";
import { daftarPesan } from "@/server/chat";
import { buktiSengketa, catatanSkor, hasilMatch, sengketaMatch } from "@/server/hari-h";
import { detailMatch } from "@/server/queries/match";

export const metadata: Metadata = { title: "Detail sengketa" };

/** Admin platform meninjau bukti, riwayat chat, catatan skor per babak, dan check-in (PRD 9.2). */
export default async function Page({ params }: PageProps<"/platform/sengketa/[id]">) {
  await requireRole("platform_admin");
  const d = detailMatch((await params).id);
  const s = d && sengketaMatch(d.match.id);
  const rc = d && hasilMatch(d.match.id);
  if (!d || !s || !rc || !d.lawan) notFound();
  const m = d.match;
  const nama = (id: string) => (id === d.pembuat.id ? d.pembuat.name : d.lawan!.name);
  const teks = (a: number | null, b: number | null) => `${d.pembuat.name} ${a}–${b} ${d.lawan!.name}`;

  return (
    <>
      <HeaderHalaman judul="Detail sengketa" kembali="/platform/sengketa" />
      <KepalaMatch
        pembuat={d.pembuat}
        lawan={d.lawan}
        status={m.status}
        format={m.format}
        level={m.level}
        sub={
          <div className="flex flex-col gap-2 text-sm">
            {m.scheduledAt && <p className="font-bold">{formatJadwal(m.scheduledAt)} WIB</p>}
            <InfoLapangan l={{ venueName: d.venue?.name, venueVerified: d.venue?.verified, alamatVenue: d.venue?.address, manualName: m.manualVenueName, manualAddress: m.manualVenueAddress }} />
          </div>
        }
      />
      <Card>
        <LabelSeksi>Dua versi skor</LabelSeksi>
        <dl className="grid gap-3 md:grid-cols-2">
          <div className="rounded-besar bg-krem p-3">
            <dt className="text-xs font-bold text-teks-2">Pengusul ({nama(rc.proposerClubId)}, pencatat)</dt>
            <dd className="text-lg font-extrabold">{teks(rc.creatorScore, rc.opponentScore)}</dd>
          </div>
          <div className="rounded-besar bg-krem p-3">
            <dt className="text-xs font-bold text-teks-2">Penyanggah</dt>
            <dd className="text-lg font-extrabold text-merah">{teks(rc.counterCreatorScore, rc.counterOpponentScore)}</dd>
          </div>
        </dl>
        <p className="text-[13px] text-teks-2">Dibuka {formatJadwal(s.openedAt)} · tenggat bukti {formatJadwal(s.evidenceDeadline)} WIB</p>
      </Card>
      <Card>
        <LabelSeksi>Bukti</LabelSeksi>
        {buktiSengketa(s.id).length ? (
          <ul className="flex flex-col gap-2">
            {buktiSengketa(s.id).map((b) => (
              <li key={b.id} className="flex flex-col gap-1 rounded-tombol border-2 border-nonaktif-tepi px-3.5 py-2.5 text-sm">
                <span className="font-bold">
                  {nama(b.clubId)} · {formatJadwal(b.createdAt)}
                </span>
                <span>{b.note}</span>
                {b.url && (
                  <a href={b.url} target="_blank" rel="noreferrer noopener" className="font-bold break-all text-hijau underline underline-offset-4">
                    {b.url}
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-teks-2">Belum ada bukti.</p>
        )}
      </Card>
      <LaporanMatch match={m} catatan={catatanSkor(m.id)} />
      <ChatMatch matchId={m.id} awal={daftarPesan(m.id).map((p) => ({ ...p, at: p.at.toISOString() }))} bisaTulis={false} hanyaBaca />
      {s.decidedAt ? (
        <Banner jenis="saran" judul={`Sudah diputus: ${s.decision}`}>
          {s.reason} · {formatJadwal(s.decidedAt)}
        </Banner>
      ) : (
        <Card>
          <LabelSeksi>Keputusan</LabelSeksi>
          <FormKeputusanSengketa matchId={m.id} pembuat={d.pembuat.name} lawan={d.lawan.name} usulan={teks(rc.creatorScore, rc.opponentScore)} sanggahan={teks(rc.counterCreatorScore, rc.counterOpponentScore)} />
        </Card>
      )}
    </>
  );
}
