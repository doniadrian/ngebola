import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { AvatarPemain } from "@/components/ngebola/avatar-pemain";
import { FormProfilPemain } from "@/components/ngebola/form-profil-pemain";
import { HapusAkun } from "@/components/ngebola/hapus-akun";
import { HeaderHalaman } from "@/components/ngebola/header";
import { TombolKeluar } from "@/components/ngebola/tombol-keluar";
import { Card } from "@/components/ui/card";
import { db } from "@/db";
import { players } from "@/db/schema";
import { requireRole } from "@/server/authz";
import { clubAktifPemain } from "@/server/queries/identitas";

export const metadata: Metadata = { title: "Profil" };

export default async function Page() {
  const user = await requireRole("player");
  const p = db.select().from(players).where(eq(players.userId, user.id)).get()!;
  const club = clubAktifPemain(user.id);
  return (
    <>
      <HeaderHalaman judul="Profil" />
      <Card className="flex-row items-center gap-4">
        <AvatarPemain seed={p.avatarSeed} nama={user.name} foto={p.photoPath} jersey={club?.jerseyHome} ukuran={72} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-extrabold">{user.name}</span>
          <span className="truncate text-[13px] text-teks-2">{club ? club.name : "Belum bergabung dengan club"}</span>
          <span className="truncate text-xs text-teks-2">{user.email}</span>
        </div>
      </Card>
      <div className="rounded-kartu border-2 border-nonaktif-tepi bg-krem-terang p-5">
        <FormProfilPemain awal={{ name: user.name, position: p.position, dominantFoot: p.dominantFoot, area: p.area, photoPath: p.photoPath }} />
      </div>
      <TombolKeluar className="md:hidden" />
      <section className="flex flex-col gap-2 border-t-2 border-nonaktif-tepi pt-4">
        <p className="text-[13px] text-teks-2">Data pribadimu bisa dihapus kapan saja. Lihat <a href="/kebijakan-privasi" className="font-bold text-hijau underline underline-offset-2">Kebijakan Privasi</a>.</p>
        <HapusAkun />
      </section>
    </>
  );
}
