import Link from "next/link";
import { CalendarBlankIcon } from "@phosphor-icons/react/ssr";
import { InfoLapangan, KepalaMatch } from "@/components/ngebola/match-ui";
import type { Tugas } from "@/components/ngebola/perlu-dilakukan";
import { KartuKosong } from "@/components/ngebola/umpan-balik";
import { Button } from "@/components/ui/button";
import { LabelSeksi } from "@/components/ui/card";
import { formatJam, formatTanggalPanjang } from "@/lib/waktu";
import { bolehBertanding } from "@/server/club";
import type { ClubRingkas } from "@/server/queries/identitas";
import { belumSiap, kelompokJadwal, tugasHariH } from "@/server/queries/jadwal-club";

/** Tindakan match milik club ini saja (PRD 1): ajakan yang menunggu jawaban, usulan perubahan, kesiapan. */
export function tugasMatchClub(clubId: string): Tugas[] {
  const k = kelompokJadwal(clubId);
  const tugas: Tugas[] = k.masuk.map(({ match: m, pembuat, lawan }) => {
    const musuh = m.creatorClubId === clubId ? lawan : pembuat;
    const ubah = k.perluSetuju.has(m.id);
    return {
      key: m.id,
      judul: ubah ? `Usulan perubahan dari ${musuh?.name}` : m.status === "ditantang" ? `Tantangan dari ${musuh?.name}` : `Tawaran dari ${musuh?.name}`,
      sub: ubah ? "Setujui atau tolak" : "Terima, tawar, atau tolak sebelum tenggat",
      href: `/club/match/${m.id}`,
      mendesak: true,
    };
  });
  const h = tugasHariH(clubId);
  const musuhDari = (x: (typeof h.checkIn)[number]) => (x.match.creatorClubId === clubId ? x.lawan : x.pembuat)?.name;
  for (const x of h.checkIn) tugas.unshift({ key: `ci-${x.match.id}`, judul: `Check-in vs ${musuhDari(x)}`, sub: "Check-in dibuka. Toleransi 20 menit setelah kick-off.", href: `/club/match/${x.match.id}`, mendesak: true });
  for (const x of h.konfirmasi) tugas.unshift({ key: `ko-${x.match.id}`, judul: `Konfirmasi hasil vs ${musuhDari(x)}`, sub: "Tanpa respons 48 jam, skor pengusul sah.", href: `/club/match/${x.match.id}`, mendesak: true });
  for (const x of h.bukti) tugas.unshift({ key: `bk-${x.match.id}`, judul: `Lampirkan bukti sengketa vs ${musuhDari(x)}`, sub: "Tenggat 48 jam sejak sengketa dibuka.", href: `/club/match/${x.match.id}`, mendesak: true });
  for (const x of h.nilai) tugas.push({ key: `nl-${x.match.id}`, judul: `Nilai sportivitas ${musuhDari(x)}`, href: `/club/match/${x.match.id}` });
  for (const { match: m, pembuat, lawan } of belumSiap(clubId)) {
    const musuh = m.creatorClubId === clubId ? lawan : pembuat;
    tugas.push({ key: `siap-${m.id}`, judul: `Tandai siap vs ${musuh?.name}`, sub: m.scheduledAt ? `${formatTanggalPanjang(m.scheduledAt)} · ${formatJam(m.scheduledAt)} WIB` : undefined, href: `/club/match/${m.id}` });
  }
  return tugas;
}

/** Match berikutnya di beranda Admin club. */
export function BerandaMatch({ club }: { club: ClubRingkas }) {
  const k = kelompokJadwal(club.id);
  const berikut = k.jadwal.find((m) => m.match.status === "terkonfirmasi" || m.match.status === "berlangsung");
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <LabelSeksi>Match berikutnya</LabelSeksi>
        <Link href="/club/jadwal?tab=jadwal" className="text-sm font-bold text-hijau underline decoration-2 underline-offset-4">
          Lihat semua
        </Link>
      </div>
      {berikut ? (
        <Link href={`/club/match/${berikut.match.id}`} className="rounded-kartu outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-hijau">
          <KepalaMatch
            tanpaTautan
            pembuat={berikut.pembuat}
            lawan={berikut.lawan}
            status={berikut.match.status}
            format={berikut.match.format}
            level={berikut.match.level}
            sub={
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-[15px] font-extrabold">
                  <CalendarBlankIcon weight="bold" className="size-5 text-hijau" aria-hidden />
                  {formatTanggalPanjang(berikut.match.scheduledAt!)} · {formatJam(berikut.match.scheduledAt!)} WIB
                </p>
                <InfoLapangan l={{ venueName: berikut.venue?.name, manualName: berikut.match.manualVenueName }} alamat={false} />
              </div>
            }
          />
        </Link>
      ) : (
        <KartuKosong
          judul="Belum ada match terjadwal"
          aksi={
            bolehBertanding(club) ? (
              <Button asChild>
                <Link href="/club/cari-lawan">Cari Lawan</Link>
              </Button>
            ) : undefined
          }
        >
          Pak Bola sudah pemanasan. Cari club di Pekanbaru yang jadwalnya cocok.
        </KartuKosong>
      )}
    </section>
  );
}
