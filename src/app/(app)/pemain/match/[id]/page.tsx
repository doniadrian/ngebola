import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarBlankIcon } from "@phosphor-icons/react/ssr";
import { HeaderHalaman } from "@/components/ngebola/header";
import { InfoLapangan, KepalaMatch, teksBiaya } from "@/components/ngebola/match-ui";
import { SegmenRsvp } from "@/components/ngebola/segmen-rsvp";
import { Banner } from "@/components/ngebola/umpan-balik";
import { Card, LabelSeksi } from "@/components/ui/card";
import { LABEL_ALASAN_BATAL, MIN_PEMAIN } from "@/db/enums";
import { formatJadwal, formatJam, formatTanggalPanjang } from "@/lib/waktu";
import { requireRole } from "@/server/authz";
import { terkunci } from "@/server/kesiapan";
import { peserta } from "@/server/match";
import { clubAktifPemain } from "@/server/queries/identitas";
import { detailMatch, jawabanRsvp } from "@/server/queries/match";

export const metadata: Metadata = { title: "Detail match" };

/** Pemain hanya melihat match club sendiri, tanpa chat dan tanpa tindakan match (PRD 4.4). */
export default async function Page({ params }: PageProps<"/pemain/match/[id]">) {
  const user = await requireRole("player");
  const club = clubAktifPemain(user.id);
  const d = club ? detailMatch((await params).id) : null;
  if (!club || !d || !peserta(d.match, club.id) || ["draf", "terbuka", "ditantang", "dinegosiasi"].includes(d.match.status)) notFound();
  const m = d.match;
  const kesiapan = d.kesiapan.find((k) => k.clubId === club.id);
  const skor = m.finalCreatorScore != null ? (m.creatorClubId === club.id ? `${m.finalCreatorScore}–${m.finalOpponentScore}` : `${m.finalOpponentScore}–${m.finalCreatorScore}`) : null;

  return (
    <>
      <HeaderHalaman judul="Detail match" kembali="/pemain/jadwal" />
      <KepalaMatch
        pembuat={d.pembuat}
        lawan={d.lawan}
        status={m.status}
        format={m.format}
        level={m.level}
        sub={
          <div className="flex flex-col gap-2.5">
            {m.scheduledAt && (
              <p className="flex items-center gap-2 text-[15px] font-extrabold">
                <CalendarBlankIcon weight="bold" className="size-5 text-hijau" aria-hidden />
                {formatTanggalPanjang(m.scheduledAt)} · {formatJam(m.scheduledAt)} WIB
              </p>
            )}
            <InfoLapangan l={{ venueName: d.venue?.name, venueVerified: d.venue?.verified, alamatVenue: d.venue?.address, lat: d.venue?.lat, lng: d.venue?.lng, manualName: m.manualVenueName, manualAddress: m.manualVenueAddress }} />
            <p className="text-[13px] text-teks-2">{teksBiaya(m.feeTotal)}</p>
            {skor && <p className="text-2xl font-extrabold text-hijau">Skor akhir {skor}</p>}
          </div>
        }
      />
      {m.status === "terkonfirmasi" && (
        <Card>
          <LabelSeksi>Kamu ikut main?</LabelSeksi>
          <SegmenRsvp matchId={m.id} jawaban={jawabanRsvp(m.id, user.id)} terkunci={terkunci(m)} />
          <p className="text-[13px] text-teks-2">
            {club.name}: {kesiapan?.playersReady ?? 0} pemain siap (minimal {MIN_PEMAIN[m.format]}) · {kesiapan?.isReady ? "ditandai siap" : "belum ditandai siap"}.
          </p>
        </Card>
      )}
      {m.status === "ditunda" && m.rescheduleDeadline && <Banner jenis="tindakan" judul="Match ditunda">Jadwal baru disepakati paling lambat {formatJadwal(m.rescheduleDeadline)}.</Banner>}
      {m.status === "dibatalkan" && <Banner jenis="tindakan" judul="Match dibatalkan">{m.cancelReason ? LABEL_ALASAN_BATAL[m.cancelReason] : ""}</Banner>}
    </>
  );
}
