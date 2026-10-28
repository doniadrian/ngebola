import "server-only";
import { count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { clubs, disputes, moderationFlags, reports } from "@/db/schema";
import { terkunci } from "../kesiapan";
import type { SessionUser } from "../auth/service";
import { anggotaSkuad } from "./club";
import { clubAktifPemain, clubMilikAdmin } from "./identitas";
import { kelompokJadwal, tugasHariH } from "./jadwal-club";
import { jadwalPemain } from "./pemain";

const n = (rows: { n: number }[]) => rows[0]?.n ?? 0;

/** Angka merah di navigasi = jumlah hal yang perlu ditanggapi peran ini (Navigasi.html). */
export function jumlahNav(user: SessionUser): Record<string, number> {
  if (user.role === "club_admin") {
    const club = clubMilikAdmin(user.id);
    if (!club) return {};
    const h = tugasHariH(club.id);
    return {
      "/club/jadwal": kelompokJadwal(club.id).masuk.length + h.checkIn.length + h.konfirmasi.length + h.bukti.length,
      "/club/skuad": anggotaSkuad(club.id, "diajukan").length,
    };
  }
  if (user.role === "player") {
    const club = clubAktifPemain(user.id);
    if (!club) return {};
    const { mendatang, jawaban } = jadwalPemain(user.id, club.id);
    return { "/pemain/jadwal": mendatang.filter((m) => m.match.status === "terkonfirmasi" && !jawaban.get(m.match.id) && !terkunci(m.match)).length };
  }
  return {
    "/platform/verifikasi": n(db.select({ n: count() }).from(clubs).where(eq(clubs.registrationStatus, "diajukan")).all()),
    "/platform/sengketa": n(db.select({ n: count() }).from(disputes).where(isNull(disputes.decidedAt)).all()),
    "/platform/lainnya":
      n(db.select({ n: count() }).from(reports).where(eq(reports.status, "terbuka")).all()) + n(db.select({ n: count() }).from(moderationFlags).where(eq(moderationFlags.status, "terbuka")).all()),
  };
}
