import "server-only";
import { prosesTenggatHariH } from "./hari-h";
import { prosesPengingat } from "./pengingat";
import { prosesTenggatMatch } from "./tenggat";

/** Semua pekerjaan berkala (tenggat match, WO, hasil, sengketa, pengingat). Idempoten; aman dari interval maupun /api/cron. */
export async function jalankanBerkala(now = new Date()) {
  const match = await prosesTenggatMatch(now);
  const hariH = await prosesTenggatHariH(now);
  const pengingat = await prosesPengingat(now);
  return { match, hariH, pengingat };
}
