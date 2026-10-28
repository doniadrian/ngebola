import "server-only";
import { and, eq, gt, inArray, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { clubs, matches, matchReadiness, reminderLog, resultConfirmations, rsvps, squadMemberships } from "@/db/schema";
import { formatJadwal, HARI, JAM } from "@/lib/waktu";
import { pesanSistem } from "./match";
import { beritahu } from "./notify";

type Jenis = "h3" | "h1" | "2jam" | "hasil1" | "hasil2";
const JADWAL: { jenis: "h3" | "h1" | "2jam"; sebelum: number; label: string; pemain: boolean }[] = [
  { jenis: "2jam", sebelum: 2 * JAM, label: "2 jam lagi", pemain: true },
  { jenis: "h1", sebelum: 24 * JAM, label: "besok", pemain: true },
  { jenis: "h3", sebelum: 3 * HARI, label: "3 hari lagi", pemain: false },
];

/** Catat pengingat terkirim; false bila sudah pernah (cron idempoten). */
function catat(matchId: string, userId: string, kind: Jenis, now: Date) {
  return db.insert(reminderLog).values({ matchId, userId, kind, sentAt: now }).onConflictDoNothing().run().changes === 1;
}

const nama = (id: string) => db.select({ name: clubs.name }).from(clubs).where(eq(clubs.id, id)).get()?.name ?? "Club";
const admin = (id: string) => db.select({ id: clubs.adminUserId }).from(clubs).where(eq(clubs.id, id)).get()?.id;

/**
 * Pengingat otomatis (S-03, P-06, R-04, H-05). Hanya pengingat paling dekat yang dikirim bila beberapa ambang sudah lewat
 * sekaligus (mis. match baru disepakati 20 jam sebelum kick-off → hanya H-1).
 */
export async function prosesPengingat(now = new Date()) {
  let terkirim = 0;
  const dekat = db
    .select()
    .from(matches)
    .where(and(eq(matches.status, "terkonfirmasi"), gt(matches.scheduledAt, now), lt(matches.scheduledAt, new Date(now.getTime() + 3 * HARI))))
    .all();

  for (const m of dekat) {
    const sisa = m.scheduledAt!.getTime() - now.getTime();
    const j = JADWAL.find((x) => sisa <= x.sebelum);
    if (!j) continue;
    const clubIds = [m.creatorClubId, m.opponentClubId!];
    const judul = `Pengingat: ${nama(m.creatorClubId)} vs ${nama(m.opponentClubId!)} ${j.label}`;
    const body = `${formatJadwal(m.scheduledAt!)} WIB`;

    const admins = clubIds.map(admin).filter((id): id is string => !!id && catat(m.id, id, j.jenis, now));
    if (admins.length) {
      await beritahu(admins, { trigger: `pengingat_${j.jenis}`, title: judul, body, url: `/club/match/${m.id}` });
      terkirim += admins.length;
    }

    if (j.pemain) {
      const tidak = new Set(db.select({ id: rsvps.playerUserId }).from(rsvps).where(and(eq(rsvps.matchId, m.id), eq(rsvps.answer, "tidak"))).all().map((r) => r.id));
      const pemain = db
        .select({ id: squadMemberships.playerUserId })
        .from(squadMemberships)
        .where(and(inArray(squadMemberships.clubId, clubIds), eq(squadMemberships.status, "aktif")))
        .all()
        .map((r) => r.id)
        .filter((id) => !tidak.has(id) && catat(m.id, id, j.jenis, now));
      if (pemain.length) {
        await beritahu(pemain, { trigger: `pengingat_${j.jenis}`, title: judul, body, url: `/pemain/match/${m.id}` });
        terkirim += pemain.length;
      }
    }

    // R-04: pada H-1, club yang belum siap diumumkan ke lawan lewat pesan sistem di chat match.
    // Dikirim bersamaan dengan pengingat H-1 admin (yang tercatat sekali), jadi tidak berulang.
    if (j.jenis === "h1" && admins.length) {
      const siap = new Map(db.select().from(matchReadiness).where(eq(matchReadiness.matchId, m.id)).all().map((r) => [r.clubId, r.isReady]));
      for (const cid of clubIds.filter((c) => !siap.get(c))) {
        pesanSistem(db, m.id, `${nama(cid)} belum menandai siap. Kick-off ${formatJadwal(m.scheduledAt!)} WIB.`, now);
      }
    }
  }

  // H-05: lawan menerima 2 pengingat sebelum tenggat konfirmasi hasil (24 jam & 4 jam tersisa).
  const tunggu = db
    .select({ m: matches, rc: resultConfirmations })
    .from(resultConfirmations)
    .innerJoin(matches, eq(matches.id, resultConfirmations.matchId))
    .where(and(eq(matches.status, "menunggu_hasil"), isNull(resultConfirmations.response), gt(resultConfirmations.deadline, now)))
    .all();
  for (const { m, rc } of tunggu) {
    const sisa = rc.deadline.getTime() - now.getTime();
    const kind: Jenis | null = sisa <= 4 * JAM ? "hasil2" : sisa <= 24 * JAM ? "hasil1" : null;
    const lawan = rc.proposerClubId === m.creatorClubId ? m.opponentClubId! : m.creatorClubId;
    const target = admin(lawan);
    if (!kind || !target || !catat(m.id, target, kind, now)) continue;
    db.update(resultConfirmations).set({ remindersSent: rc.remindersSent + 1 }).where(eq(resultConfirmations.id, rc.id)).run();
    await beritahu([target], { trigger: "pengingat_hasil", title: "Konfirmasi hasil sebelum tenggat", body: `Tenggat ${formatJadwal(rc.deadline)} WIB. Tanpa respons, skor pengusul sah.`, url: `/club/match/${m.id}` });
    terkirim++;
  }
  return { terkirim };
}
