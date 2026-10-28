import type { Metadata } from "next";
import { desc, eq, like } from "drizzle-orm";
import { HeaderHalaman } from "@/components/ngebola/header";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { formatJadwal } from "@/lib/waktu";
import { requireRole } from "@/server/authz";

export const metadata: Metadata = { title: "Log audit" };

/** Log audit (9.1): setiap tindakan admin — siapa, kapan, apa, alasan. Hanya baca. */
const LABEL_TARGET: Record<string, string> = { club: "Club", match: "Match", user: "Pengguna", venue: "Lapangan", pesan: "Pesan chat", platform_settings: "Pengaturan", report: "Laporan", flag: "Pola mencurigakan" };
const kapital = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export default async function Page({ searchParams }: PageProps<"/platform/audit">) {
  await requireRole("platform_admin");
  const { aksi } = await searchParams;
  const q = typeof aksi === "string" ? aksi.trim() : "";
  const baris = db
    .select({ a: auditLogs, pelaku: users.name })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(q ? like(auditLogs.action, `%${q}%`) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(200)
    .all();
  return (
    <>
      <HeaderHalaman judul="Log audit" kembali="/platform/lainnya" />
      <form action="/platform/audit" method="get" className="flex gap-2">
        <label className="flex h-[52px] flex-1 items-center rounded-full border-2 border-hijau bg-krem-terang px-4 has-[:focus-visible]:bg-white has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emas/60">
          <span className="sr-only">Saring tindakan</span>
          <input name="aksi" defaultValue={q} placeholder="mis. sengketa, tangguhkan, setujui" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-placeholder" />
        </label>
        <Button variant="garis" type="submit">Saring</Button>
      </form>
      <ol className="flex flex-col gap-2">
        {baris.map(({ a, pelaku }) => (
          <li key={a.id} className="flex flex-col gap-0.5 rounded-tombol border-2 border-nonaktif-tepi bg-krem-terang px-3.5 py-2.5 text-sm">
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold">{kapital(a.action.replaceAll("_", " "))}</span>
              <span className="text-xs text-teks-2">{formatJadwal(a.createdAt)}</span>
            </span>
            <span className="text-teks-2">
              {pelaku ?? "Sistem"} · {LABEL_TARGET[a.targetType] ?? a.targetType}
              {a.detail ? ` · ${a.detail}` : ""}
            </span>
            {a.reason && <span>Alasan: {a.reason}</span>}
          </li>
        ))}
      </ol>
    </>
  );
}
