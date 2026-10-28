import type { Metadata } from "next";
import { asc, eq, like, or, sql } from "drizzle-orm";
import { DialogAlasan } from "@/components/ngebola/dialog-alasan";
import { HeaderHalaman } from "@/components/ngebola/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { clubs, squadMemberships, users } from "@/db/schema";
import { LABEL_PERAN } from "@/db/enums";
import { requireRole } from "@/server/authz";

export const metadata: Metadata = { title: "Pengguna" };

export default async function Page({ searchParams }: PageProps<"/platform/pengguna">) {
  const saya = await requireRole("platform_admin");
  const { cari } = await searchParams;
  const q = typeof cari === "string" ? cari.trim().toLowerCase() : "";
  const daftar = q
    ? db
        .select({ u: users, clubAdmin: clubs.name })
        .from(users)
        .leftJoin(clubs, eq(clubs.adminUserId, users.id))
        .where(or(like(sql`lower(${users.name})`, `%${q}%`), like(users.email, `%${q}%`)))
        .orderBy(asc(users.name))
        .limit(50)
        .all()
    : [];
  const clubPemain = (id: string) =>
    db.select({ name: clubs.name }).from(squadMemberships).innerJoin(clubs, eq(clubs.id, squadMemberships.clubId)).where(sql`${squadMemberships.playerUserId} = ${id} and ${squadMemberships.status} = 'aktif'`).get()?.name;

  return (
    <>
      <HeaderHalaman judul="Pengguna" kembali="/platform/lainnya" />
      <form action="/platform/pengguna" method="get" className="flex gap-2">
        <label className="flex h-[52px] flex-1 items-center rounded-full border-2 border-hijau bg-krem-terang px-4 has-[:focus-visible]:bg-white has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emas/60">
          <span className="sr-only">Cari nama atau email</span>
          <input name="cari" defaultValue={q} placeholder="Nama atau email" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-placeholder" />
        </label>
        <Button variant="garis" type="submit">Cari</Button>
      </form>
      {q && daftar.length === 0 && <p className="text-sm text-teks-2">Tidak ada pengguna yang cocok.</p>}
      <ul className="flex flex-col gap-2">
        {daftar.map(({ u, clubAdmin }) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-besar border-2 border-hijau bg-krem-terang px-4 py-3">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-extrabold">{u.name}</span>
              <span className="truncate text-xs text-teks-2">
                {u.email} · {LABEL_PERAN[u.role]}
                {clubAdmin ? ` · ${clubAdmin}` : u.role === "player" && clubPemain(u.id) ? ` · ${clubPemain(u.id)}` : ""}
              </span>
            </span>
            <Badge variant={u.status === "aktif" ? "saran" : "bahaya"}>{u.status}</Badge>
            {u.id !== saya.id &&
              (u.status === "aktif" ? (
                <DialogAlasan jenis="nonaktifkan" targetId={u.id} pemicu="Nonaktifkan" varianPemicu="teks" bahaya judul={`Nonaktifkan ${u.name}?`} deskripsi="Semua sesinya dicabut; akun tidak bisa masuk atau reset password." label="Ya, Nonaktifkan" berhasil="Akun dinonaktifkan" />
              ) : (
                <DialogAlasan jenis="aktifkan" targetId={u.id} pemicu="Aktifkan" varianPemicu="teks" judul={`Aktifkan ${u.name}?`} deskripsi="Akun bisa masuk kembali." label="Aktifkan" berhasil="Akun diaktifkan" />
              ))}
          </li>
        ))}
      </ul>
    </>
  );
}
