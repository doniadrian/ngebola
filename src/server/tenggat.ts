import "server-only";
import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { clubs, matches, scheduleProposals } from "@/db/schema";
import { JAM } from "@/lib/waktu";
import { pesanSistem } from "./match";
import { beritahu } from "./notify";

const adminDari = (clubIds: (string | null)[]) =>
  clubIds.filter(Boolean).map((id) => db.select({ id: clubs.adminUserId }).from(clubs).where(eq(clubs.id, id!)).get()?.id).filter(Boolean) as string[];

/**
 * Tenggat otomatis (PRD 6, 10.1). Dijalankan berkala (instrumentation / /api/cron). Idempoten.
 * - Ditantang/Dinegosiasi lewat tenggat respons → Kedaluwarsa.
 * - Terbuka tanpa opsi jadwal > 24 jam lagi → Kedaluwarsa.
 * - Ditunda lewat 14 hari tanpa jadwal baru → Dibatalkan tanpa penalti.
 */
export async function prosesTenggatMatch(now = new Date()) {
  const kabar: { userIds: string[]; title: string; url: string }[] = [];

  const lewat = db.select().from(matches).where(and(inArray(matches.status, ["ditantang", "dinegosiasi"]), lt(matches.responseDeadline, now))).all();
  const terbuka = db.select().from(matches).where(eq(matches.status, "terbuka")).all();
  const masihAda = new Set(
    terbuka.length
      ? db
          .select({ matchId: scheduleProposals.matchId })
          .from(scheduleProposals)
          .where(and(inArray(scheduleProposals.matchId, terbuka.map((m) => m.id)), eq(scheduleProposals.status, "menunggu"), gt(scheduleProposals.startsAt, new Date(now.getTime() + 24 * JAM))))
          .all()
          .map((p) => p.matchId)
      : [],
  );
  const kedaluwarsa = [...lewat, ...terbuka.filter((m) => !masihAda.has(m.id))];
  const tunda = db.select().from(matches).where(and(eq(matches.status, "ditunda"), lt(matches.rescheduleDeadline, now))).all();

  db.transaction((tx) => {
    for (const m of kedaluwarsa) {
      tx.update(matches).set({ status: "kedaluwarsa", responseDeadline: null, updatedAt: now }).where(and(eq(matches.id, m.id), eq(matches.status, m.status))).run();
      tx.update(scheduleProposals).set({ status: "kedaluwarsa" }).where(and(eq(scheduleProposals.matchId, m.id), eq(scheduleProposals.status, "menunggu"))).run();
      if (m.opponentClubId && m.status === "dinegosiasi") pesanSistem(tx, m.id, "Tidak ada respons sampai tenggat. Ajakan ditutup otomatis.", now);
      kabar.push({ userIds: adminDari([m.creatorClubId, m.opponentClubId]), title: "Ajakan sparring kedaluwarsa", url: `/club/match/${m.id}` });
    }
    for (const m of tunda) {
      tx.update(matches)
        .set({ status: "dibatalkan", cancelReason: "lainnya", cancelNote: "Jadwal baru tidak disepakati dalam 14 hari. Dibatalkan tanpa penalti.", lateCancel: false, updatedAt: now })
        .where(and(eq(matches.id, m.id), eq(matches.status, "ditunda")))
        .run();
      pesanSistem(tx, m.id, "14 hari berlalu tanpa jadwal baru. Match dibatalkan tanpa penalti.", now);
      kabar.push({ userIds: adminDari([m.creatorClubId, m.opponentClubId]), title: "Match yang ditunda dibatalkan tanpa penalti", url: `/club/match/${m.id}` });
    }
  });

  for (const k of kabar) await beritahu(k.userIds, { trigger: "tenggat_match", title: k.title, url: k.url });
  return { kedaluwarsa: kedaluwarsa.length, tundaBatal: tunda.length };
}
