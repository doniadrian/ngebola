import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatMatch } from "@/components/ngebola/chat-match";
import { HeaderHalaman } from "@/components/ngebola/header";
import { LaporanMatch } from "@/components/ngebola/laporan-match";
import { InfoLapangan, KepalaMatch, teksBiaya } from "@/components/ngebola/match-ui";
import { Button } from "@/components/ui/button";
import { LABEL_ALASAN_BATAL } from "@/db/enums";
import { formatJadwal } from "@/lib/waktu";
import { requireRole } from "@/server/authz";
import { chatAda, daftarPesan } from "@/server/chat";
import { catatanSkor, sengketaMatch } from "@/server/hari-h";
import { detailMatch } from "@/server/queries/match";

export const metadata: Metadata = { title: "Detail match" };

/** Tampilan baca-saja untuk dukungan & moderasi (PRD 9.1): detail, laporan skor, dan chat. */
export default async function Page({ params }: PageProps<"/platform/match/[id]">) {
  await requireRole("platform_admin");
  const d = detailMatch((await params).id);
  if (!d) notFound();
  const m = d.match;
  return (
    <>
      <HeaderHalaman judul="Detail match" kembali={`/platform/club/${m.creatorClubId}`} />
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
            <p className="text-teks-2">{teksBiaya(m.feeTotal)}</p>
            {m.cancelReason && <p className="text-teks-2">Dibatalkan: {LABEL_ALASAN_BATAL[m.cancelReason]}{m.cancelNote ? ` — ${m.cancelNote}` : ""}{m.lateCancel ? " (mendadak)" : ""}</p>}
          </div>
        }
      />
      {sengketaMatch(m.id) && (
        <Button asChild variant="garis" className="self-start">
          <Link href={`/platform/sengketa/${m.id}`}>Buka sengketa</Link>
        </Button>
      )}
      {["menunggu_hasil", "sengketa", "selesai", "berlangsung"].includes(m.status) && <LaporanMatch match={m} catatan={catatanSkor(m.id)} />}
      {chatAda(m) && <ChatMatch matchId={m.id} awal={daftarPesan(m.id).map((p) => ({ ...p, at: p.at.toISOString() }))} bisaTulis={false} hanyaBaca />}
    </>
  );
}
