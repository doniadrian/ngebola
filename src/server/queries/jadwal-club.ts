import "server-only";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { checkins, disputeEvidence, disputes, matchChangeRequests, matches, matchReadiness, resultConfirmations, reviews } from "@/db/schema";
import { HARI } from "@/lib/waktu";
import { pihakMenunggu, usulanTerbaru } from "../match";
import { matchClub, opsiPertama, type BarisMatch } from "./match";

export type Kelompok = { masuk: BarisMatch[]; terkirim: BarisMatch[]; jadwal: BarisMatch[]; riwayat: BarisMatch[]; tanggal: Map<string, Date>; perluSetuju: Set<string> };

/** Kelompokkan match club untuk tab Jadwal & "Perlu Anda lakukan". */
export function kelompokJadwal(clubId: string): Kelompok {
  const semua = matchClub(clubId);
  const menunggu = (m: BarisMatch) => pihakMenunggu(m.match, usulanTerbaru(db, m.match.id));
  const perluSetuju = new Set(
    db
      .select({ matchId: matchChangeRequests.matchId, oleh: matchChangeRequests.requestedByClubId })
      .from(matchChangeRequests)
      .innerJoin(matches, eq(matches.id, matchChangeRequests.matchId))
      .where(and(eq(matchChangeRequests.status, "menunggu"), or(eq(matches.creatorClubId, clubId), eq(matches.opponentClubId, clubId))))
      .all()
      .filter((r) => r.oleh !== clubId)
      .map((r) => r.matchId),
  );
  const pra = ["ditantang", "dinegosiasi"];
  const masuk = semua.filter((m) => (pra.includes(m.match.status) && menunggu(m) === clubId) || perluSetuju.has(m.match.id));
  const terkirim = semua.filter((m) => (m.match.status === "terbuka" || m.match.status === "draf" || (pra.includes(m.match.status) && menunggu(m) !== clubId)) && !masuk.includes(m));
  const jadwal = semua
    .filter((m) => ["terkonfirmasi", "ditunda", "berlangsung", "menunggu_hasil", "sengketa"].includes(m.match.status))
    .sort((a, b) => (a.match.scheduledAt?.getTime() ?? 0) - (b.match.scheduledAt?.getTime() ?? 0));
  const riwayat = semua
    .filter((m) => ["selesai", "wo", "dibatalkan", "ditolak", "kedaluwarsa"].includes(m.match.status))
    .sort((a, b) => (b.match.scheduledAt ?? b.match.updatedAt).getTime() - (a.match.scheduledAt ?? a.match.updatedAt).getTime());
  return { masuk, terkirim, jadwal, riwayat, tanggal: opsiPertama([...masuk, ...terkirim].map((m) => m.match.id)), perluSetuju };
}

/** Tindakan hari H milik club ini: check-in, konfirmasi hasil, bukti sengketa, penilaian (PRD 1 "Perlu Anda lakukan"). */
export function tugasHariH(clubId: string, now = new Date()) {
  const aktif = matchClub(clubId, ["terkonfirmasi", "menunggu_hasil", "sengketa", "selesai"]);
  const ids = aktif.map((m) => m.match.id);
  if (!ids.length) return { checkIn: [], konfirmasi: [], bukti: [], nilai: [] };
  const hadir = db.select().from(checkins).where(inArray(checkins.matchId, ids)).all();
  const rc = new Map(db.select().from(resultConfirmations).where(inArray(resultConfirmations.matchId, ids)).all().map((r) => [r.matchId, r]));
  const sengketa = new Map(db.select().from(disputes).where(inArray(disputes.matchId, ids)).all().map((d) => [d.matchId, d]));
  const bukti = new Set(
    db
      .select({ disputeId: disputeEvidence.disputeId })
      .from(disputeEvidence)
      .where(eq(disputeEvidence.clubId, clubId))
      .all()
      .map((b) => b.disputeId),
  );
  const sudahNilai = new Set(db.select({ matchId: reviews.matchId }).from(reviews).where(and(eq(reviews.reviewerClubId, clubId), inArray(reviews.matchId, ids))).all().map((r) => r.matchId));
  return {
    checkIn: aktif.filter(
      (m) =>
        m.match.status === "terkonfirmasi" &&
        m.match.scheduledAt &&
        now.getTime() >= m.match.scheduledAt.getTime() - 60 * 60_000 &&
        now.getTime() <= m.match.scheduledAt.getTime() + 20 * 60_000 &&
        !hadir.some((h) => h.matchId === m.match.id && h.clubId === clubId),
    ),
    konfirmasi: aktif.filter((m) => m.match.status === "menunggu_hasil" && rc.get(m.match.id)?.proposerClubId !== clubId && !rc.get(m.match.id)?.response),
    bukti: aktif.filter((m) => {
      const d = sengketa.get(m.match.id);
      return m.match.status === "sengketa" && d && !d.decidedAt && d.evidenceDeadline > now && !bukti.has(d.id);
    }),
    nilai: aktif.filter((m) => m.match.status === "selesai" && m.match.finalCreatorScore != null && !sudahNilai.has(m.match.id) && now.getTime() - (m.match.endedAt ?? m.match.updatedAt).getTime() < 7 * HARI),
  };
}

/** Match terkonfirmasi ≤ 3 hari lagi yang club ini belum tandai siap. */
export function belumSiap(clubId: string, now = new Date()) {
  const dekat = matchClub(clubId, ["terkonfirmasi"]).filter((m) => m.match.scheduledAt && m.match.scheduledAt.getTime() - now.getTime() < 3 * HARI && m.match.scheduledAt > now);
  if (!dekat.length) return [];
  const siap = new Set(
    db
      .select({ matchId: matchReadiness.matchId })
      .from(matchReadiness)
      .where(and(eq(matchReadiness.clubId, clubId), eq(matchReadiness.isReady, true), inArray(matchReadiness.matchId, dekat.map((m) => m.match.id))))
      .all()
      .map((r) => r.matchId),
  );
  return dekat.filter((m) => !siap.has(m.match.id));
}
