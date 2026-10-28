import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowsClockwiseIcon, CalendarBlankIcon, CheckIcon, ClockIcon, MinusIcon, QuestionIcon, XIcon } from "@phosphor-icons/react/ssr";
import { AjukanPerubahan, AksiDraf, BatalkanMatch, LihatOpsi, PanelKesiapan, PutuskanPerubahan, ResponsAjakan, TarikAjakan, type OpsiUsulan } from "@/components/ngebola/aksi-match";
import { AvatarPemain } from "@/components/ngebola/avatar-pemain";
import { ChatMatch } from "@/components/ngebola/chat-match";
import { HeaderHalaman } from "@/components/ngebola/header";
import { InfoLapangan, KepalaMatch, teksBiaya } from "@/components/ngebola/match-ui";
import { Banner } from "@/components/ngebola/umpan-balik";
import { Button } from "@/components/ui/button";
import { Card, LabelSeksi } from "@/components/ui/card";
import { LABEL_ALASAN_BATAL, MIN_PEMAIN } from "@/db/enums";
import { formatJadwal, formatTanggalPanjang, formatJam } from "@/lib/waktu";
import { cn } from "@/lib/utils";
import { requireRole } from "@/server/authz";
import { chatAda, chatTerbuka, daftarPesan, diblokir } from "@/server/chat";
import { bolehBertanding, clubMilik } from "@/server/club";
import { terkunci } from "@/server/kesiapan";
import { BATAS_BATAL_MENDADAK_MS, MAKS_PUTARAN, peserta, salingBlokir } from "@/server/match";
import { jumlahAnggota } from "@/server/queries/club";
import { detailMatch, rsvpSkuad, type DetailMatch } from "@/server/queries/match";
import { opsiLapangan } from "@/server/queries/venue";
import { PanelHariH } from "./hari-h";

export const metadata: Metadata = { title: "Detail match" };

const keOpsi = (u: DetailMatch["usulan"]): OpsiUsulan[] =>
  u.filter((x) => x.p.status === "menunggu").map((x) => ({ id: x.p.id, startsAt: x.p.startsAt.toISOString(), lapangan: x.venueName ?? x.p.manualVenueName, manual: !x.venueName && !!x.p.manualVenueName, feeTotal: x.p.feeTotal }));

export default async function Page({ params, searchParams }: PageProps<"/club/match/[id]">) {
  const user = await requireRole("club_admin");
  const club = clubMilik(user.id);
  if (!club) redirect("/club/daftar-club");
  const { id } = await params;
  const d = detailMatch(id);
  if (!d) notFound();
  const m = d.match;
  const ikut = peserta(m, club.id);
  const terbukaUntukSaya = m.status === "terbuka" && m.type === "terbuka" && !ikut && !salingBlokir(club.id, m.creatorClubId);
  if (!ikut && !terbukaUntukSaya) notFound();

  const { baru } = await searchParams;
  const now = new Date();
  const lawan = m.creatorClubId === club.id ? d.lawan : d.pembuat;
  const sayaPembuat = m.creatorClubId === club.id;
  const opsi = keOpsi(d.usulan);
  const venues = opsiLapangan();
  const giliranSaya = d.menunggu === club.id;
  const pending = d.perubahan.find((p) => p.status === "menunggu");
  const kesiapanSaya = d.kesiapan.find((k) => k.clubId === club.id);
  const kesiapanLawan = d.kesiapan.find((k) => k.clubId !== club.id);
  const terkonfirmasi = m.status === "terkonfirmasi";

  return (
    <>
      <HeaderHalaman judul="Detail match" kembali={terbukaUntukSaya ? "/club/cari-lawan" : "/club/jadwal"} />
      {baru === "1" && <Banner jenis="saran">{m.type === "terbuka" ? "Match terbuka terbit. Club lain bisa menerima atau menawar balik." : `Tantangan terkirim ke ${d.lawan?.name}.`}</Banner>}

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
            {m.scheduledAt && <InfoLapangan l={{ venueName: d.venue?.name, venueVerified: d.venue?.verified, alamatVenue: d.venue?.address, lat: d.venue?.lat, lng: d.venue?.lng, manualName: m.manualVenueName, manualAddress: ikut ? m.manualVenueAddress : null }} />}
            <p className="text-[13px] text-teks-2">
              {teksBiaya(m.feeTotal)} · Area {m.area}
            </p>
            {m.notes && <p className="rounded-tombol bg-krem px-3.5 py-2.5 text-sm">“{m.notes}”</p>}
          </div>
        }
      />

      {/* Status sebelum kesepakatan */}
      {m.status === "draf" && sayaPembuat && (
        <Card>
          <LabelSeksi>Draf match terbuka</LabelSeksi>
          <LihatOpsi opsi={opsi} />
          <AksiDraf matchId={m.id} />
        </Card>
      )}

      {terbukaUntukSaya && (
        <Card>
          <LabelSeksi>Pilih jadwal</LabelSeksi>
          {bolehBertanding(club) ? (
            <ResponsAjakan matchId={m.id} opsi={opsi} venues={venues} format={m.format} bolehTolak={false} bolehTawar putaran={m.negotiationRound} maksPutaran={MAKS_PUTARAN} />
          ) : (
            <Banner jenis="tindakan">Club kamu belum bisa bertanding (belum disetujui atau ditangguhkan).</Banner>
          )}
        </Card>
      )}

      {ikut && (m.status === "terbuka" || m.status === "ditantang" || m.status === "dinegosiasi") && (
        <Card>
          {giliranSaya ? (
            <>
              <LabelSeksi>{m.status === "ditantang" ? "Tantangan masuk" : `Tawaran dari ${lawan?.name}`}</LabelSeksi>
              {m.responseDeadline && <TenggatInfo at={m.responseDeadline} />}
              <ResponsAjakan matchId={m.id} opsi={opsi} venues={venues} format={m.format} bolehTolak bolehTawar={m.negotiationRound < MAKS_PUTARAN} putaran={m.negotiationRound} maksPutaran={MAKS_PUTARAN} />
            </>
          ) : (
            <>
              <LabelSeksi>{m.status === "terbuka" ? "Menunggu lawan" : `Menunggu jawaban ${lawan?.name}`}</LabelSeksi>
              {m.responseDeadline && <TenggatInfo at={m.responseDeadline} />}
              <LihatOpsi opsi={opsi} />
              <div className="flex justify-end">
                {m.status === "dinegosiasi" ? null : <TarikAjakan matchId={m.id} terbuka={m.status === "terbuka"} />}
              </div>
            </>
          )}
          {m.status === "dinegosiasi" && (
            <p className="text-[13px] text-teks-2">
              Putaran tawar balik {m.negotiationRound} dari {MAKS_PUTARAN}.
            </p>
          )}
        </Card>
      )}

      {/* Status setelah kesepakatan */}
      {ikut && (terkonfirmasi || m.status === "ditunda") && (
        <>
          {m.status === "ditunda" && m.rescheduleDeadline && (
            <Banner jenis="tindakan" judul="Match ditunda">
              Sepakati jadwal baru sebelum <b>{formatJadwal(m.rescheduleDeadline)}</b>. Lewat dari itu, match dibatalkan tanpa penalti.
            </Banner>
          )}
          {pending && (
            <Card className={cn(pending.requestedByClubId !== club.id && "border-tinta bg-bg-menunggu")}>
              <LabelSeksi>Usulan perubahan {pending.requestedByClubId === club.id ? "(menunggu lawan)" : `dari ${lawan?.name}`}</LabelSeksi>
              <p className="text-[15px] font-bold">{teksPerubahan(pending, venues)}</p>
              {pending.requestedByClubId !== club.id ? <PutuskanPerubahan matchId={m.id} requestId={pending.id} /> : <p className="text-[13px] text-teks-2">Perubahan baru berlaku setelah disetujui.</p>}
            </Card>
          )}
          {terkonfirmasi && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <LabelSeksi>Kesiapan {club.name}</LabelSeksi>
                <PanelKesiapan
                  matchId={m.id}
                  format={m.format}
                  jumlah={kesiapanSaya?.playersReady ?? 0}
                  manual={kesiapanSaya?.manualOverride ?? false}
                  siap={kesiapanSaya?.isReady ?? false}
                  punyaSkuad={jumlahAnggota(club.id) > 0}
                  terkunci={terkunci(m, now)}
                />
              </Card>
              <Card>
                <LabelSeksi>Kesiapan {lawan?.name}</LabelSeksi>
                <p className="text-[32px] leading-none font-extrabold text-hijau">{kesiapanLawan?.playersReady ?? 0}</p>
                <p className="text-sm text-teks-2">pemain siap · minimal {MIN_PEMAIN[m.format]}</p>
                <p className={cn("flex items-center gap-1.5 text-sm font-bold", kesiapanLawan?.isReady ? "text-hijau" : "text-emas-tua")}>
                  {kesiapanLawan?.isReady ? <CheckIcon weight="bold" aria-hidden /> : <ClockIcon weight="bold" aria-hidden />}
                  {kesiapanLawan?.isReady ? "Siap main" : "Belum siap"}
                </p>
              </Card>
            </div>
          )}
          {terkonfirmasi && <RsvpSkuad matchId={m.id} clubId={club.id} jersey={club.jerseyHome} />}
          {!pending && !terkunci(m, now) && <AjukanPerubahan matchId={m.id} venues={venues} format={m.format} ditunda={m.status === "ditunda"} />}
          <div className="flex justify-end">
            <BatalkanMatch matchId={m.id} lawan={lawan?.name ?? "Lawan"} mepet={terkonfirmasi && !!m.scheduledAt && m.scheduledAt.getTime() - now.getTime() < BATAS_BATAL_MENDADAK_MS} />
          </div>
        </>
      )}

      {ikut && <PanelHariH match={m} clubId={club.id} lawan={lawan} />}

      {ikut && ["ditolak", "kedaluwarsa", "dibatalkan"].includes(m.status) && (
        <Banner jenis="tindakan" judul={m.status === "ditolak" ? "Ajakan ditolak" : m.status === "kedaluwarsa" ? "Ajakan kedaluwarsa" : "Match dibatalkan"}>
          {m.status === "dibatalkan" && m.cancelReason ? `${LABEL_ALASAN_BATAL[m.cancelReason]}${m.cancelNote ? ` — ${m.cancelNote}` : ""}` : m.cancelNote ?? "Tidak ada kesepakatan sebelum tenggat."}
          {m.lateCancel && m.cancelledByClubId === club.id ? " Pembatalan mendadak menurunkan keandalan club kamu." : ""}
        </Banner>
      )}

      {ikut && m.status === "selesai" && lawan?.slug && (
        <div className="flex justify-end">
          <Button asChild variant="garis">
            <Link href={`/club/tantang/${lawan.slug}?rematch=${m.id}`}>
              <ArrowsClockwiseIcon weight="bold" aria-hidden />
              Ajak Main Lagi
            </Link>
          </Button>
        </div>
      )}

      {ikut && d.perubahan.some((p) => p.status !== "menunggu") && (
        <section className="flex flex-col gap-3">
          <LabelSeksi>Riwayat perubahan</LabelSeksi>
          <ul className="flex flex-col gap-2">
            {d.perubahan
              .filter((p) => p.status !== "menunggu")
              .map((p) => (
                <li key={p.id} className="flex flex-col gap-0.5 rounded-tombol border-2 border-nonaktif-tepi px-3.5 py-2.5 text-sm">
                  <span className="font-bold">{teksPerubahan(p, venues)}</span>
                  <span className="text-xs text-teks-2">
                    Diusulkan {p.requestedByClubId === club.id ? club.name : lawan?.name}, {formatJadwal(p.createdAt)} · {p.status === "disetujui" ? "disetujui" : "ditolak"}
                    {p.decidedAt ? ` ${formatJadwal(p.decidedAt)}` : ""}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {ikut && chatAda(m) && lawan && (
        <ChatMatch
          matchId={m.id}
          awal={daftarPesan(m.id).map((p) => ({ ...p, at: p.at.toISOString() }))}
          clubSayaId={club.id}
          bisaTulis={chatTerbuka(m, now)}
          lawan={{ id: lawan.id, name: lawan.name }}
          sudahBlokir={diblokir(club.id, lawan.id)}
        />
      )}
    </>
  );
}

function TenggatInfo({ at }: { at: Date }) {
  return (
    <p className="flex items-center gap-1.5 text-[13px] font-bold text-emas-tua">
      <ClockIcon weight="bold" className="size-4" aria-hidden />
      Tenggat respons {formatJadwal(at)} WIB
    </p>
  );
}

function teksPerubahan(p: DetailMatch["perubahan"][number], venues: { id: string; name: string }[]) {
  if (p.kind === "jadwal") return `Jadwal: ${p.fromValue ? formatJadwal(new Date(p.fromValue)) : "—"} → ${formatJadwal(new Date(p.toValue!))} WIB`;
  if (p.kind === "lapangan") {
    const nama = (v: string | null) => (!v ? "—" : v.startsWith("venue:") ? (venues.find((x) => x.id === v.slice(6))?.name ?? "lapangan") : `${v.slice(7).split("\n")[0]} (belum terverifikasi)`);
    return `Lapangan: ${nama(p.fromValue)} → ${nama(p.toValue)}`;
  }
  return `Penundaan: ${p.reason ?? ""}`;
}

const IKON_RSVP = { ikut: CheckIcon, tidak: XIcon, ragu: QuestionIcon };
const LABEL_RSVP = { ikut: "Ikut", tidak: "Tidak", ragu: "Ragu" };

function RsvpSkuad({ matchId, clubId, jersey }: { matchId: string; clubId: string; jersey: string }) {
  const daftar = rsvpSkuad(matchId, clubId);
  if (!daftar.length) return null;
  const hitung = (j: string | null) => daftar.filter((d) => d.jawaban === j).length;
  return (
    <section className="flex flex-col gap-3">
      <LabelSeksi>
        Konfirmasi skuad · {hitung("ikut")} ikut · {hitung("ragu")} ragu · {hitung("tidak")} tidak · {hitung(null)} belum
      </LabelSeksi>
      <ul className="grid gap-2 md:grid-cols-2">
        {daftar.map((p) => {
          const Ikon = p.jawaban ? IKON_RSVP[p.jawaban] : MinusIcon;
          return (
            <li key={p.userId} className="flex items-center gap-3 rounded-tombol border-2 border-nonaktif-tepi bg-krem-terang px-3 py-2">
              <AvatarPemain seed={p.avatarSeed} nama={p.name} foto={p.photoPath} jersey={jersey} ukuran={32} />
              <span className="flex-1 truncate text-sm font-bold">{p.name}</span>
              <span className={cn("flex items-center gap-1 text-[13px] font-extrabold", p.jawaban === "ikut" ? "text-hijau" : p.jawaban === "tidak" ? "text-merah" : "text-teks-2")}>
                <Ikon weight="bold" className="size-4" aria-hidden />
                {p.jawaban ? LABEL_RSVP[p.jawaban] : "Belum"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
