import Link from "next/link";
import { CalendarBlankIcon } from "@phosphor-icons/react/ssr";
import { InfoLapangan, KepalaMatch } from "@/components/ngebola/match-ui";
import { SegmenRsvp } from "@/components/ngebola/segmen-rsvp";
import { LabelSeksi } from "@/components/ui/card";
import { formatJam, formatTanggalPanjang } from "@/lib/waktu";
import { terkunci } from "@/server/kesiapan";
import type { ClubRingkas } from "@/server/queries/identitas";
import { jadwalPemain } from "@/server/queries/pemain";

/** Match berikutnya + konfirmasi ikut di beranda Pemain. */
export function BerandaMatchPemain({ userId, club }: { userId: string; club: ClubRingkas }) {
  const { mendatang, jawaban } = jadwalPemain(userId, club.id);
  const berikut = mendatang.find((m) => m.match.status === "terkonfirmasi");
  if (!berikut) {
    return (
      <p className="rounded-kartu border-2 border-dashed border-nonaktif-tepi px-4 py-6 text-center text-sm text-teks-2">
        Belum ada match terjadwal. Admin club akan mengatur sparring; kamu diberi tahu saat match terkonfirmasi.
      </p>
    );
  }
  const m = berikut.match;
  const belum = mendatang.filter((x) => x.match.status === "terkonfirmasi" && !jawaban.get(x.match.id)).length;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <LabelSeksi>Match berikutnya</LabelSeksi>
        <Link href="/pemain/jadwal" className="text-sm font-bold text-hijau underline decoration-2 underline-offset-4">
          Semua jadwal{belum > 1 ? ` (${belum} belum dijawab)` : ""}
        </Link>
      </div>
      <KepalaMatch
        pembuat={berikut.pembuat}
        lawan={berikut.lawan}
        status={m.status}
        format={m.format}
        level={m.level}
        sub={
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-[15px] font-extrabold">
              <CalendarBlankIcon weight="bold" className="size-5 text-hijau" aria-hidden />
              {formatTanggalPanjang(m.scheduledAt!)} · {formatJam(m.scheduledAt!)} WIB
            </p>
            <InfoLapangan l={{ venueName: berikut.venue?.name, venueVerified: berikut.venue?.verified, alamatVenue: berikut.venue?.address, lat: berikut.venue?.lat, lng: berikut.venue?.lng, manualName: m.manualVenueName, manualAddress: m.manualVenueAddress }} />
            <span className="text-sm font-bold">Kamu ikut main?</span>
            <SegmenRsvp matchId={m.id} jawaban={jawaban.get(m.id) ?? null} terkunci={terkunci(m)} />
          </div>
        }
      />
    </section>
  );
}
