import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { DialogAlasan } from "@/components/ngebola/dialog-alasan";
import { HeaderHalaman } from "@/components/ngebola/header";
import { KartuKosong } from "@/components/ngebola/umpan-balik";
import { Badge } from "@/components/ui/badge";
import { Card, LabelSeksi } from "@/components/ui/card";
import { db } from "@/db";
import { chatMessages, clubs, moderationFlags, reports, reviews, users } from "@/db/schema";
import { formatJadwal } from "@/lib/waktu";
import { requireRole } from "@/server/authz";

export const metadata: Metadata = { title: "Laporan & moderasi" };

const LABEL_FLAG = { pasangan_sering: "Pasangan sering bertanding", lonjakan_rating: "Lonjakan rating", akun_ganda: "Akun ganda", ulasan_pola: "Pola penilaian" };

export default async function Page() {
  await requireRole("platform_admin");
  const laporan = db.select({ r: reports, pelapor: users.name }).from(reports).innerJoin(users, eq(users.id, reports.reporterUserId)).where(eq(reports.status, "terbuka")).orderBy(asc(reports.createdAt)).all();
  const pesan = new Map(
    laporan.some((l) => l.r.targetType === "pesan")
      ? db.select().from(chatMessages).where(inArray(chatMessages.id, laporan.filter((l) => l.r.targetType === "pesan").map((l) => l.r.targetId))).all().map((p) => [p.id, p])
      : [],
  );
  const ulasan = new Map(
    laporan.some((l) => l.r.targetType === "ulasan")
      ? db.select().from(reviews).where(inArray(reviews.id, laporan.filter((l) => l.r.targetType === "ulasan").map((l) => l.r.targetId))).all().map((p) => [p.id, p])
      : [],
  );
  const flag = db.select({ f: moderationFlags, club: clubs.name }).from(moderationFlags).leftJoin(clubs, eq(clubs.id, moderationFlags.clubId)).where(eq(moderationFlags.status, "terbuka")).orderBy(desc(moderationFlags.createdAt)).all();

  return (
    <>
      <HeaderHalaman judul="Laporan & moderasi" kembali="/platform/lainnya" />
      <section className="flex flex-col gap-3">
        <LabelSeksi>Laporan pengguna · {laporan.length}</LabelSeksi>
        {laporan.length === 0 ? (
          <KartuKosong judul="Tidak ada laporan terbuka">Laporan pesan chat, penilaian, atau club akan muncul di sini.</KartuKosong>
        ) : (
          <ul className="flex flex-col gap-3">
            {laporan.map(({ r, pelapor }) => {
              const p = r.targetType === "pesan" ? pesan.get(r.targetId) : undefined;
              const u = r.targetType === "ulasan" ? ulasan.get(r.targetId) : undefined;
              return (
                <li key={r.id}>
                  <Card className="gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="menunggu">{r.targetType}</Badge>
                      <span className="text-xs text-teks-2">
                        {pelapor} · {formatJadwal(r.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">
                      <b>Alasan:</b> {r.reason}
                    </p>
                    {p && (
                      <blockquote className="rounded-tombol border-2 border-nonaktif-tepi bg-krem px-3 py-2 text-sm">
                        “{p.body}” ·{" "}
                        <Link href={`/platform/match/${p.matchId}`} className="font-bold text-hijau underline underline-offset-4">
                          buka chat
                        </Link>
                      </blockquote>
                    )}
                    {u && <blockquote className="rounded-tombol border-2 border-nonaktif-tepi bg-krem px-3 py-2 text-sm">Sportivitas {u.sportsmanship}/5 · “{u.comment ?? "tanpa komentar"}”</blockquote>}
                    <div className="flex flex-wrap justify-end gap-3">
                      <DialogAlasan jenis="laporan-tolak" targetId={r.id} pemicu="Tolak Laporan" varianPemicu="teks" min={5} judul="Tolak laporan ini?" deskripsi="Konten tetap tampil." label="Tolak Laporan" berhasil="Laporan ditolak" />
                      <DialogAlasan
                        jenis="laporan-tindak"
                        targetId={r.id}
                        pemicu={r.targetType === "pesan" ? "Sembunyikan Pesan" : r.targetType === "ulasan" ? "Kecualikan Penilaian" : "Tandai Ditindak"}
                        min={5}
                        judul="Tindak laporan ini?"
                        deskripsi={r.targetType === "pesan" ? "Pesan diganti tulisan 'disembunyikan moderator'." : r.targetType === "ulasan" ? "Penilaian dikecualikan dari rata-rata sportivitas." : "Gunakan halaman club untuk peringatan/penangguhan."}
                        label="Tindak"
                        berhasil="Laporan ditindak"
                      />
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-3">
        <LabelSeksi>Pola mencurigakan (anti-manipulasi) · {flag.length}</LabelSeksi>
        {flag.length === 0 ? (
          <p className="rounded-kartu border-2 border-dashed border-nonaktif-tepi px-4 py-5 text-center text-sm text-teks-2">Tidak ada pola yang perlu ditinjau.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {flag.map(({ f, club }) => (
              <li key={f.id}>
                <Card className="gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="bahaya">{LABEL_FLAG[f.kind]}</Badge>
                    <span className="text-xs text-teks-2">{formatJadwal(f.createdAt)}</span>
                  </div>
                  <p className="text-sm">
                    {f.clubId ? (
                      <Link href={`/platform/club/${f.clubId}`} className="font-bold text-hijau underline underline-offset-4">
                        {club}
                      </Link>
                    ) : null}{" "}
                    {f.detail}
                  </p>
                  <div className="flex flex-wrap justify-end gap-3">
                    <DialogAlasan jenis="flag-abaikan" targetId={f.id} pemicu="Abaikan" varianPemicu="teks" min={5} judul="Abaikan tanda ini?" deskripsi="Tidak ada tindakan lanjutan." label="Abaikan" berhasil="Tanda diabaikan" />
                    <DialogAlasan jenis="flag-tinjau" targetId={f.id} pemicu="Tandai Sudah Ditinjau" min={5} judul="Tandai sudah ditinjau?" deskripsi="Catat hasil tinjauan. Sanksi (peringatan/penangguhan) dilakukan dari halaman club." label="Simpan" berhasil="Tanda ditinjau" />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
