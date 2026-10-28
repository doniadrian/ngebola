import type { Metadata } from "next";
import { HeaderHalaman } from "@/components/ngebola/header";
import { BarisJadwal, ringkasJadwal } from "@/components/ngebola/match-ui";
import { KartuKosong } from "@/components/ngebola/umpan-balik";
import { LabelSeksi } from "@/components/ui/card";
import { LABEL_FORMAT } from "@/db/enums";
import { requireRole } from "@/server/authz";
import { clubAktifPemain } from "@/server/queries/identitas";
import { jadwalPemain } from "@/server/queries/pemain";
import type { BarisMatch } from "@/server/queries/match";

export const metadata: Metadata = { title: "Jadwal" };

const LABEL_JAWAB = { ikut: "Kamu: ikut", tidak: "Kamu: tidak", ragu: "Kamu: ragu" };

export default async function Page() {
  const user = await requireRole("player");
  const club = clubAktifPemain(user.id);
  if (!club) {
    return (
      <>
        <HeaderHalaman judul="Jadwal" />
        <KartuKosong judul="Belum ada jadwal">Gabung skuad club-mu dulu. Match yang sudah terkonfirmasi akan muncul di sini.</KartuKosong>
      </>
    );
  }
  const { mendatang, hasil, diikuti, jawaban } = jadwalPemain(user.id, club.id);

  return (
    <>
      <HeaderHalaman judul="Jadwal">
        <p className="text-sm text-teks-2">Match {club.name}. Konfirmasi ikut bisa diubah sampai 2 jam sebelum kick-off.</p>
      </HeaderHalaman>
      <section className="flex flex-col gap-3">
        <LabelSeksi>Mendatang</LabelSeksi>
        <Daftar clubId={club.id} jawaban={jawaban} items={mendatang} kosong="Belum ada match terjadwal." />
      </section>
      <section className="flex flex-col gap-3">
        <LabelSeksi>Hasil club</LabelSeksi>
        <Daftar clubId={club.id} jawaban={jawaban} items={hasil.slice(0, 20)} kosong="Belum ada hasil." />
      </section>
      <section className="flex flex-col gap-3">
        <LabelSeksi>Riwayat yang kamu ikuti · {diikuti.length} match</LabelSeksi>
        <Daftar clubId={club.id} jawaban={jawaban} items={diikuti.slice(0, 20)} kosong="Belum ada match yang kamu ikuti." />
      </section>
    </>
  );
}

function Daftar({ items, kosong, clubId, jawaban }: { items: BarisMatch[]; kosong: string; clubId: string; jawaban: Map<string, string> }) {
  return items.length ? (
      <ul className="flex flex-col gap-3">
        {items.map(({ match: m, pembuat, lawan, venue }) => {
          const musuh = m.creatorClubId === clubId ? lawan : pembuat;
          const j = jawaban.get(m.id) as keyof typeof LABEL_JAWAB | undefined;
          const skor = m.finalCreatorScore != null ? (m.creatorClubId === clubId ? `${m.finalCreatorScore}–${m.finalOpponentScore}` : `${m.finalOpponentScore}–${m.finalCreatorScore}`) : null;
          return (
            <BarisJadwal
              key={m.id}
              href={`/pemain/match/${m.id}`}
              at={m.scheduledAt}
              lawan={`vs ${musuh?.name ?? "—"}`}
              sub={`${LABEL_FORMAT[m.format]} · ${ringkasJadwal(m.scheduledAt, venue?.name ?? m.manualVenueName)}`}
              status={m.status}
              tambahan={
                <>
                  {skor && <span className="text-sm font-extrabold tabular-nums text-hijau">{skor}</span>}
                  {m.status === "terkonfirmasi" && <span className={j ? "text-xs font-bold text-teks-2" : "text-xs font-extrabold text-merah"}>{j ? LABEL_JAWAB[j] : "Belum dijawab"}</span>}
                </>
              }
            />
          );
        })}
      </ul>
    ) : (
      <p className="rounded-kartu border-2 border-dashed border-nonaktif-tepi px-4 py-6 text-center text-sm text-teks-2">{kosong}</p>
    );
}
