import { CheckCircleIcon, ClockIcon, StarIcon } from "@phosphor-icons/react/ssr";
import { FormBukti, FormPenilaian, KonfirmasiHasil, TombolCheckIn, TombolMulai } from "@/components/ngebola/aksi-hari-h";
import { LaporanMatch } from "@/components/ngebola/laporan-match";
import { LihatSkor, PencatatSkor } from "@/components/ngebola/pencatat-skor";
import { Banner } from "@/components/ngebola/umpan-balik";
import { Card, LabelSeksi } from "@/components/ui/card";
import type { matches } from "@/db/schema";
import { formatJadwal, formatJam, MENIT } from "@/lib/waktu";
import { cn } from "@/lib/utils";
import { keadaanSkor } from "@/server/domain/skor";
import { buktiSengketa, BUKA_CHECKIN_MS, catatanSkor, checkInDibuka, hasilMatch, penilaianMatch, sengketaMatch, sudahCheckIn, TOLERANSI_WO_MS } from "@/server/hari-h";
import { clubDariId } from "@/server/queries/club";

type Match = typeof matches.$inferSelect;

/** Panel hari pertandingan: check-in → pencatat skor → konfirmasi hasil → sengketa → penilaian (PRD 5.3, 5.4). */
export function PanelHariH({ match: m, clubId, lawan }: { match: Match; clubId: string; lawan: { id: string; name: string } | null }) {
  const now = new Date();
  if (!m.opponentClubId || !lawan) return null;
  const pembuat = clubDariId(m.creatorClubId)!;
  const penerima = clubDariId(m.opponentClubId)!;
  const saya = clubId === pembuat.id ? pembuat : penerima;

  if (m.status === "terkonfirmasi" && m.scheduledAt) {
    const hadir = sudahCheckIn(m.id);
    const sayaHadir = hadir.some((h) => h.clubId === clubId);
    const lawanHadir = hadir.some((h) => h.clubId !== clubId);
    const buka = checkInDibuka(m, now);
    const lewat = now.getTime() > m.scheduledAt.getTime() + TOLERANSI_WO_MS;
    return (
      <Card>
        <LabelSeksi>Hari pertandingan</LabelSeksi>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {[
            [saya.name, sayaHadir],
            [lawan.name, lawanHadir],
          ].map(([nama, ok]) => (
            <li key={nama as string} className={cn("flex items-center gap-2 rounded-tombol border-2 px-3 py-2", ok ? "border-hijau bg-bg-saran" : "border-nonaktif-tepi")}>
              {ok ? <CheckCircleIcon weight="fill" className="size-5 text-hijau" aria-hidden /> : <ClockIcon weight="bold" className="size-5 text-teks-2" aria-hidden />}
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-bold">{nama as string}</span>
                <span className="text-xs text-teks-2">{ok ? "Sudah check-in" : "Belum check-in"}</span>
              </span>
            </li>
          ))}
        </ul>
        {!buka ? (
          <p className="text-[13px] text-teks-2">Check-in dibuka {formatJadwal(new Date(m.scheduledAt.getTime() - BUKA_CHECKIN_MS))} WIB, 60 menit sebelum kick-off.</p>
        ) : lewat ? (
          <p className="text-[13px] text-teks-2">Toleransi 20 menit lewat. Status WO diproses otomatis.</p>
        ) : !sayaHadir ? (
          <TombolCheckIn matchId={m.id} />
        ) : lawanHadir ? (
          <>
            <p className="text-[13px] text-teks-2">Kedua club sudah check-in. Admin yang menekan Mulai menjadi satu-satunya pencatat skor.</p>
            <TombolMulai matchId={m.id} />
          </>
        ) : (
          <p className="text-[13px] text-teks-2">
            Menunggu {lawan.name} check-in. Bila belum check-in sampai {formatJam(new Date(m.scheduledAt.getTime() + 20 * MENIT))} WIB, club kamu menang WO 3-0.
          </p>
        )}
      </Card>
    );
  }

  const catatan = catatanSkor(m.id);
  const keadaan = keadaanSkor(catatan);

  if (m.status === "berlangsung") {
    return (
      <Card>
        <LabelSeksi>Skor</LabelSeksi>
        {m.scorerClubId === clubId ? (
          <PencatatSkor matchId={m.id} awal={keadaan} pembuat={{ name: pembuat.name }} lawan={{ name: penerima.name }} />
        ) : (
          <>
            <LihatSkor matchId={m.id} awal={keadaan} pembuat={{ name: pembuat.name }} lawan={{ name: penerima.name }} />
            <p className="text-center text-xs text-teks-2">Pencatat: {clubDariId(m.scorerClubId!)?.name}. Kamu tetap bisa melihat skor secara langsung.</p>
          </>
        )}
      </Card>
    );
  }

  const rc = hasilMatch(m.id);
  const d = sengketaMatch(m.id);
  const teks = (a: number, b: number) => `${pembuat.name} ${a}–${b} ${penerima.name}`;

  return (
    <>
      {m.status === "menunggu_hasil" && rc && (
        <Card className={cn(rc.proposerClubId !== clubId && "border-tinta bg-bg-menunggu")}>
          <LabelSeksi>Konfirmasi hasil</LabelSeksi>
          <p className="text-center text-[32px] leading-tight font-extrabold text-hijau">
            {rc.creatorScore}–{rc.opponentScore}
          </p>
          <p className="text-center text-sm text-teks-2">{teks(rc.creatorScore, rc.opponentScore)} · dicatat {clubDariId(rc.proposerClubId)?.name}</p>
          <p className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-emas-tua">
            <ClockIcon weight="bold" className="size-4" aria-hidden />
            Tenggat {formatJadwal(rc.deadline)} WIB. Tanpa respons, skor ini sah.
          </p>
          {rc.proposerClubId !== clubId ? <KonfirmasiHasil matchId={m.id} pembuat={pembuat.name} lawan={penerima.name} /> : <p className="text-center text-sm">Menunggu konfirmasi {lawan.name}.</p>}
        </Card>
      )}

      {m.status === "sengketa" && rc && d && (
        <Card className="border-merah">
          <LabelSeksi>Sengketa hasil</LabelSeksi>
          <dl className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-besar bg-krem p-3">
              <dt className="text-xs font-bold text-teks-2">Versi {clubDariId(rc.proposerClubId)?.name}</dt>
              <dd className="text-2xl font-extrabold text-hijau">
                {rc.creatorScore}–{rc.opponentScore}
              </dd>
            </div>
            <div className="rounded-besar bg-krem p-3">
              <dt className="text-xs font-bold text-teks-2">Versi penyanggah</dt>
              <dd className="text-2xl font-extrabold text-merah">
                {rc.counterCreatorScore}–{rc.counterOpponentScore}
              </dd>
            </div>
          </dl>
          <p className="text-[13px] text-teks-2">
            Bukti paling lambat {formatJadwal(d.evidenceDeadline)} WIB. Admin platform memutus dalam 3 hari kerja sejak bukti lengkap.
          </p>
          <ul className="flex flex-col gap-2">
            {buktiSengketa(d.id).map((b) => (
              <li key={b.id} className="rounded-tombol border-2 border-nonaktif-tepi px-3.5 py-2.5 text-sm">
                <span className="font-bold">{b.clubId === clubId ? "Club kamu" : lawan.name}</span> · {b.note}
                {b.url && (
                  <a href={b.url} target="_blank" rel="noreferrer noopener" className="ml-1 font-bold text-hijau underline underline-offset-4">
                    Buka tautan
                  </a>
                )}
              </li>
            ))}
          </ul>
          {d.evidenceDeadline > now && <FormBukti matchId={m.id} />}
        </Card>
      )}

      {m.status === "wo" && (
        <Banner jenis={m.woWinnerClubId === clubId ? "saran" : "gagal"} judul={m.woWinnerClubId === clubId ? "Menang WO 3-0" : "Kalah WO 0-3"}>
          Hanya {clubDariId(m.woWinnerClubId!)?.name} yang check-in sampai 20 menit setelah kick-off. WO tidak mengubah rating, hanya keandalan.
        </Banner>
      )}

      {m.status === "selesai" && (
        <Card>
          <LabelSeksi>Hasil resmi</LabelSeksi>
          {m.finalCreatorScore != null ? (
            <p className="text-center text-[40px] leading-tight font-extrabold text-hijau">
              {m.finalCreatorScore}–{m.finalOpponentScore}
            </p>
          ) : (
            <p className="text-center text-sm font-bold">Dibatalkan dari catatan oleh Admin platform.</p>
          )}
          {d?.decidedAt && <p className="text-center text-[13px] text-teks-2">Diputus Admin platform: {d.reason}</p>}
          {m.excludedFromRating && m.finalCreatorScore != null && <p className="text-center text-[13px] text-teks-2">Hasil ini tidak dihitung ke rating (anti-manipulasi).</p>}
        </Card>
      )}

      {["selesai", "menunggu_hasil", "sengketa"].includes(m.status) && <LaporanMatch match={m} catatan={catatan} />}

      {m.status === "selesai" && m.finalCreatorScore != null && <Penilaian matchId={m.id} clubId={clubId} lawan={lawan.name} />}
    </>
  );
}

function Penilaian({ matchId, clubId, lawan }: { matchId: string; clubId: string; lawan: string }) {
  const p = penilaianMatch(matchId, clubId);
  return (
    <Card>
      <LabelSeksi>Penilaian sportivitas</LabelSeksi>
      {!p.sudahSaya && <FormPenilaian matchId={matchId} lawan={lawan} />}
      {p.daftar.length > 0 && (
        <ul className="flex flex-col gap-2">
          {p.daftar.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 rounded-tombol border-2 border-nonaktif-tepi px-3.5 py-2.5 text-sm">
              <span className="font-bold">{r.reviewerClubId === clubId ? "Penilaian club kamu" : `Dari ${lawan}`}</span>
              <span className="flex items-center gap-3 text-teks-2">
                <span className="flex items-center gap-1">
                  <StarIcon weight="fill" className="size-4 text-emas" aria-hidden /> Sportivitas {r.sportsmanship}/5
                </span>
                <span>Kerapian {r.tidiness}/5</span>
              </span>
              {r.comment && <span>“{r.comment}”</span>}
            </li>
          ))}
        </ul>
      )}
      {p.sudahSaya && !p.terbuka && <p className="text-[13px] text-teks-2">Penilaian {lawan} untuk club kamu terbuka setelah mereka mengisi atau 7 hari berlalu.</p>}
    </Card>
  );
}
