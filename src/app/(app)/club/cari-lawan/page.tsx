import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon, SwordIcon } from "@phosphor-icons/react/ssr";
import { IdentitasClub, KartuMatchTerbuka, LimaLaga } from "@/components/ngebola/club";
import { bacaFilter, FilterTerbuka } from "@/components/ngebola/filter-terbuka";
import { HeaderHalaman } from "@/components/ngebola/header";
import { StatusRegistrasi } from "@/components/ngebola/status-registrasi";
import { KartuKosong } from "@/components/ngebola/umpan-balik";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AREA, FORMAT, LEVEL } from "@/db/enums";
import { cn } from "@/lib/utils";
import { requireRole } from "@/server/authz";
import { bolehBertanding, clubMilik } from "@/server/club";
import { salingBlokir } from "@/server/match";
import { clubLain, statistikClub } from "@/server/queries/club";
import { matchTerbuka } from "@/server/queries/publik";

export const metadata: Metadata = { title: "Cari Lawan" };

/** Cari Lawan (PLAN.md butir 20): tab Match terbuka + tab Club (kartu club → tantang). */
export default async function Page({ searchParams }: PageProps<"/club/cari-lawan">) {
  const user = await requireRole("club_admin");
  const club = clubMilik(user.id);
  if (!club) redirect("/club/daftar-club");
  const sp = await searchParams;
  if (typeof sp.match === "string") redirect(`/club/match/${sp.match}`);
  const tab = sp.tab === "club" ? "club" : "terbuka";
  const filter = { cari: typeof sp.cari === "string" ? sp.cari : undefined, area: bacaFilter(sp.area, AREA), format: bacaFilter(sp.format, FORMAT), level: bacaFilter(sp.level, LEVEL) };
  const boleh = bolehBertanding(club);


  return (
    <>
      <HeaderHalaman
        judul="Cari Lawan"
        aksi={
          boleh ? (
            <Button asChild size="k">
              <Link href="/club/match/baru">
                <PlusIcon weight="bold" aria-hidden />
                Match Terbuka
              </Link>
            </Button>
          ) : null
        }
      />
      <StatusRegistrasi club={club} />
      <nav aria-label="Cari lawan" className="flex gap-1 border-b-2 border-nonaktif-tepi">
        <TabLink id="terbuka" label="Match terbuka" aktif={tab} />
        <TabLink id="club" label="Club" aktif={tab} />
      </nav>

      {tab === "terbuka" ? (
        <TabTerbuka clubId={club.id} area={club.area} filter={filter} />
      ) : (
        <TabClub clubId={club.id} cari={filter.cari} boleh={boleh} />
      )}
    </>
  );
}

function TabLink({ id, label, aktif }: { id: string; label: string; aktif: string }) {
  return (
    <Link
      href={`/club/cari-lawan${id === "club" ? "?tab=club" : ""}`}
      aria-current={aktif === id ? "page" : undefined}
      className={cn("-mb-[2px] flex h-12 items-center border-b-4 px-4 text-[15px] outline-none focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-hijau", aktif === id ? "border-hijau font-extrabold text-hijau" : "border-transparent font-semibold text-teks-2")}
    >
      {label}
    </Link>
  );
}

function TabTerbuka({ clubId, area, filter }: { clubId: string; area: string; filter: Parameters<typeof matchTerbuka>[0] }) {
  const daftar = matchTerbuka(filter, { viewerClubId: clubId, viewerArea: area });
  return (
    <>
      <FilterTerbuka action="/club/cari-lawan" nilai={filter ?? {}} />
      {daftar.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {daftar.map((m) => (
            <KartuMatchTerbuka
              key={m.match.id}
              m={m}
              aksi={
                <Button asChild size="k">
                  <Link href={`/club/match/${m.match.id}`}>Lihat & Terima</Link>
                </Button>
              }
            />
          ))}
        </div>
      ) : (
        <KartuKosong judul="Belum ada match terbuka">Pak Bola sudah pemanasan. Coba tab Club untuk menantang club tertentu, atau buat match terbuka sendiri.</KartuKosong>
      )}
    </>
  );
}

function TabClub({ clubId, cari, boleh }: { clubId: string; cari?: string; boleh: boolean }) {
  const daftar = clubLain(clubId, cari).filter((c) => !salingBlokir(clubId, c.id));
  return (
    <>
      <form action="/club/cari-lawan" method="get" className="flex gap-2">
        <input type="hidden" name="tab" value="club" />
        <label className="flex h-[52px] flex-1 items-center rounded-full border-2 border-hijau bg-krem-terang px-4 has-[:focus-visible]:bg-white has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emas/60">
          <span className="sr-only">Cari nama club atau area</span>
          <input name="cari" defaultValue={cari} placeholder="Nama club atau daerah" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-placeholder" />
        </label>
        <Button variant="garis" type="submit">Cari</Button>
      </form>
      {daftar.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {daftar.map((c) => {
            const s = statistikClub(c.id);
            return (
              <li key={c.id}>
                <Card className="gap-3.5">
                  <IdentitasClub club={c} ukuran={52} tautan sub={c.area} />
                  <dl className="grid grid-cols-3 gap-2 rounded-besar bg-krem p-3 text-center">
                    {[
                      ["Main", s.main],
                      ["Menang", s.menang],
                      ["Rating mini", s.rating.mini?.rating ?? "—"],
                    ].map(([l, n]) => (
                      <div key={l} className="flex flex-col-reverse">
                        <dt className="text-xs text-teks-2">{l}</dt>
                        <dd className="text-xl font-extrabold text-hijau">{n}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-teks-2">5 laga terakhir</span>
                      <LimaLaga hasil={s.limaTerakhir} />
                    </span>
                    {boleh && (
                      <Button asChild>
                        <Link href={`/club/tantang/${c.slug}`}>
                          <SwordIcon weight="bold" aria-hidden />
                          Tantang
                        </Link>
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <KartuKosong judul="Tidak ada club yang cocok">Coba kata kunci lain.</KartuKosong>
      )}
    </>
  );
}
