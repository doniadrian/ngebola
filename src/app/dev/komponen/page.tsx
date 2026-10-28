import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRightIcon, CalendarBlankIcon, MagnifyingGlassIcon, PlusIcon, ShareNetworkIcon, SoccerBallIcon } from "@phosphor-icons/react/ssr";
import { AvatarPemain, AvatarTumpuk } from "@/components/ngebola/avatar-pemain";
import { BadgeStatus, KartuWasit } from "@/components/ngebola/badge-status";
import { Field } from "@/components/ngebola/field";
import { HeaderHalaman } from "@/components/ngebola/header";
import { KolomPassword } from "@/components/ngebola/kolom-password";
import { Lambang } from "@/components/ngebola/lambang";
import { PilihTanggal } from "@/components/ngebola/pilih-tanggal";
import { Banner, KartuKosong, KartuMemuat } from "@/components/ngebola/umpan-balik";
import { Badge, Hitungan, TitikBaru } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, LabelSeksi } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioCard, RadioGroup } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_MATCH, AREA } from "@/db/enums";
import { cn } from "@/lib/utils";
import { DemoDialog, DemoSheet, DemoTextarea, DemoToast } from "./demo-interaktif";
import { CalendarInline } from "./kalender";

export const metadata: Metadata = { title: "Galeri komponen" };

const VARIAN = ["utama", "emas", "garis", "teks", "bahaya"] as const;
const LABEL = { utama: "Gabung", emas: "Simpan", garis: "Jadwal", teks: "Lewati", bahaya: "Batalkan" };
// Keadaan hover/ditekan dipaksa hanya untuk audit visual (nilai dari docs/referensi/Matriks.html).
const HOVER = {
  utama: "-translate-y-px shadow-keras-lg border-hijau-hover bg-hijau-hover",
  emas: "-translate-y-px shadow-keras-lg bg-emas-hover",
  garis: "-translate-y-px shadow-keras-lg bg-white",
  teks: "bg-hijau/8",
  bahaya: "-translate-y-px shadow-keras-lg bg-merah-hover",
};
const TEKAN = {
  utama: "translate-y-1 shadow-none border-hijau-tua bg-hijau-tua",
  emas: "translate-y-1 shadow-none bg-emas-tekan",
  garis: "translate-y-1 shadow-none bg-krem-tekan",
  teks: "bg-hijau/16 text-hijau-tua",
  bahaya: "translate-y-1 shadow-none bg-merah-tekan",
};
const FOKUS = "outline-3 outline-offset-3 outline-hijau";

const DEMO_CLUB = [
  ["lancang-kuning-fc", "Lancang Kuning FC"],
  ["garuda-sail-fc", "Garuda Sail FC"],
  ["sukajadi-united", "Sukajadi United"],
  ["tenayan-raya-fc", "Tenayan Raya FC"],
  ["rumbai-veteran", "Rumbai Veteran"],
  ["marpoyan-damai-fc", "Marpoyan Damai FC"],
] as const;

function Seksi({ judul, children, className }: { judul: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-5", className)}>
      <h2 className="border-b-2 border-hijau pb-2 text-[13px] font-extrabold tracking-[.1em] text-emas-tua uppercase">{judul}</h2>
      {children}
    </section>
  );
}

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main id="konten" className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-1">
        <p className="text-[13px] font-extrabold tracking-[.1em] text-emas-tua uppercase">Hanya development</p>
        <h1 className="text-[34px] leading-tight font-extrabold tracking-tight text-hijau md:text-[44px]">Galeri komponen</h1>
        <p className="max-w-xl text-sm text-teks-2">Audit visual terhadap docs/referensi/. Cek di lebar 390 px dan desktop.</p>
      </header>

      <Seksi judul="01 · Tombol — varian × keadaan">
        <div className="overflow-x-auto rounded-kartu border-2 border-hijau bg-krem-terang p-5">
          <div className="grid min-w-[860px] grid-cols-[90px_repeat(6,minmax(0,1fr))] items-center gap-x-4 gap-y-6">
            <span />
            {["Normal", "Hover", "Ditekan", "Fokus", "Memuat", "Nonaktif"].map((k) => (
              <span key={k} className="text-[13px] font-bold text-teks-2">{k}</span>
            ))}
            {VARIAN.map((v) => (
              <div key={v} className="contents">
                <span className="text-sm font-extrabold text-hijau capitalize">{v}</span>
                <Button variant={v} className="justify-self-start">{LABEL[v]}</Button>
                <Button variant={v} className={cn("justify-self-start", HOVER[v])}>{LABEL[v]}</Button>
                <Button variant={v} className={cn("justify-self-start", TEKAN[v])}>{LABEL[v]}</Button>
                <Button variant={v} className={cn("justify-self-start", FOKUS)}>{LABEL[v]}</Button>
                <Button variant={v} loading className="justify-self-start">{LABEL[v]}</Button>
                <Button variant={v} disabled className="justify-self-start">{LABEL[v]}</Button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <Button size="k">Gabung</Button>
          <Button size="s">Gabung</Button>
          <Button size="b">Gabung</Button>
          <Button variant="emas" size="b" className="min-w-60">
            Konfirmasi Lawan
            <ArrowRightIcon weight="bold" aria-hidden />
          </Button>
          <Button>
            <SoccerBallIcon weight="bold" aria-hidden />
            Cari Lawan
          </Button>
          <Button variant="garis">
            <ShareNetworkIcon weight="bold" aria-hidden />
            Bagikan ke Grup
          </Button>
          <Button variant="garis" size="ikon" aria-label="Lihat kalender">
            <CalendarBlankIcon weight="bold" />
          </Button>
          <Button variant="emas" size="bulat" aria-label="Buat match terbuka">
            <PlusIcon weight="bold" />
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-teks-2">Nonaktif selalu dengan alasan di bawahnya:</p>
          <div className="flex flex-col items-start gap-1.5">
            <Button disabled>Tandai Siap</Button>
            <span className="text-[13px] text-teks-2">Lengkapi minimal 8 pemain dulu.</span>
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-kartu border-2 border-tinta bg-hijau p-5">
          <span className="text-sm font-extrabold text-krem">Di atas latar hijau</span>
          <div className="flex flex-wrap gap-4">
            {VARIAN.map((v) => (
              <Button key={v} variant={v} permukaan="gelap">{LABEL[v]}</Button>
            ))}
            <Button permukaan="gelap" className="outline-3 outline-offset-3 outline-emas">Fokus</Button>
          </div>
        </div>
      </Seksi>

      <Seksi judul="02 · Form & input">
        <div className="grid gap-6 md:grid-cols-3">
          <Field id="f1" label="Nama club" hint="Nama yang dilihat club lawan.">
            <Input id="f1" placeholder="mis. Garuda FC" />
          </Field>
          <Field id="f2" label="Nama club (fokus)" hint="Halo emas saat fokus.">
            <Input id="f2" defaultValue="Lancang Ku" className="bg-white ring-4 ring-emas/60" />
          </Field>
          <Field id="f3" label="Nama club (terisi)">
            <Input id="f3" defaultValue="Lancang Kuning FC" />
          </Field>
          <Field id="f4" label="Nama club (error)" error="Minimal 3 huruf.">
            <Input id="f4" defaultValue="LK" aria-invalid aria-describedby="f4-pesan" />
          </Field>
          <Field id="f5" label="Kota" hint="Kota lain menyusul.">
            <Input id="f5" defaultValue="Pekanbaru" disabled />
          </Field>
          <Field id="f6" label="Password" hint="Tombol mata menampilkan/menyembunyikan isi.">
            <KolomPassword id="f6" defaultValue="rahasia-kuat-123" />
          </Field>
          <Field id="f7" label="Area">
            <Select>
              <SelectTrigger id="f7">
                <SelectValue placeholder="Pilih kecamatan" />
              </SelectTrigger>
              <SelectContent>
                {AREA.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="f8" label="Tanggal main">
            <PilihTanggal id="f8" name="f8" defaultValue="2026-10-31" />
          </Field>
          <Field id="f9" label="Tanggal lahir" hint="Dropdown bulan & tahun.">
            <PilihTanggal id="f9" name="f9" dropdownTahun dariTahun={1950} sampaiTahun={2009} />
          </Field>
          <DemoTextarea />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold">Kolom pencarian</span>
            <label className="flex h-[52px] items-center gap-2.5 rounded-full border-2 border-hijau bg-krem-terang pr-2 pl-4 has-[:focus-visible]:bg-white has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emas/60">
              <MagnifyingGlassIcon weight="bold" className="size-5 text-hijau" aria-hidden />
              <span className="sr-only">Cari club</span>
              <input defaultValue="sukajadi" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
            </label>
            <span className="text-[13px] text-teks-2">Pencarian berbentuk pil, beda dari kolom isian biasa.</span>
          </div>
          <CalendarInline />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-sm font-bold">Pilihan (radio kartu)</legend>
            <RadioGroup defaultValue="football">
              <RadioCard value="football" judul="Football 11v11" keterangan="Minimal 8 pemain siap" />
              <RadioCard value="mini" judul="Mini soccer" keterangan="Minimal 5 pemain siap" />
              <RadioCard value="x" judul="Nonaktif" disabled />
            </RadioGroup>
          </fieldset>
          <div className="flex flex-col gap-3.5">
            <span className="text-sm font-bold">Kotak centang</span>
            <label className="flex items-start gap-3 text-[15px]"><Checkbox defaultChecked /> Kirim pengingat H-1</label>
            <label className="flex items-start gap-3 text-[15px]"><Checkbox /> Bagikan lokasi saat check-in</label>
            <label className="flex items-start gap-3 text-[15px] text-placeholder"><Checkbox disabled /> Nonaktif</label>
          </div>
          <div className="flex flex-col gap-3.5">
            <span className="text-sm font-bold">Sakelar</span>
            {[
              ["Notifikasi push", "Di perangkat ini", true, false],
              ["Jam senyap", "22.00 – 06.00 WIB", false, false],
              ["Nonaktif", "Belum tersedia", false, true],
            ].map(([j, k, on, dis]) => (
              <label key={j as string} className="flex items-center justify-between gap-3">
                <span className="flex flex-col">
                  <span className="text-[15px] font-bold">{j}</span>
                  <span className="text-xs text-teks-2">{k}</span>
                </span>
                <Switch defaultChecked={on as boolean} disabled={dis as boolean} />
              </label>
            ))}
          </div>
        </div>
      </Seksi>

      <Seksi judul="03 · Badge status">
        <div className="flex flex-wrap gap-3">
          {STATUS_MATCH.map((s) => (
            <BadgeStatus key={s} status={s} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Badge variant="info">Admin</Badge>
          <Badge variant="saran">Terverifikasi</Badge>
          <Badge variant="menunggu">Provisional</Badge>
          <Hitungan jumlah={2} />
          <Hitungan jumlah={2} warna="emas" label="2 filter aktif" />
          <TitikBaru />
          <KartuWasit warna="merah" />
          <KartuWasit warna="kuning" />
        </div>
      </Seksi>

      <Seksi judul="04 · Lambang club">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {DEMO_CLUB.map(([slug, nama]) => (
            <div key={slug} className="flex items-center gap-4 rounded-[18px] border-2 border-hijau bg-krem-terang p-4">
              <Lambang nama={nama} logo={`/demo/lambang/${slug}.svg`} ukuran={72} />
              <span className="text-[15px] leading-tight font-extrabold">{nama}</span>
            </div>
          ))}
          {[
            ["Bintang FC", "#123b2c"],
            ["Sail Muda", "#e46a1f"],
            ["Putra Siak", "#fbf8f1"],
            ["Kulim Jaya", "#24507a"],
          ].map(([nama, warna]) => (
            <div key={nama} className="flex items-center gap-4 rounded-[18px] border-2 border-dashed border-emas-tua bg-krem-terang p-4">
              <Lambang nama={nama} warna={warna} ukuran={72} />
              <span className="flex flex-col">
                <span className="text-[15px] leading-tight font-extrabold">{nama}</span>
                <span className="text-xs text-teks-2">Lambang otomatis</span>
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4 rounded-[18px] border-2 border-hijau bg-krem-terang px-6 py-5">
          <span className="text-sm font-extrabold">Versi mini · 28px</span>
          {DEMO_CLUB.map(([slug, nama]) => (
            <Lambang key={slug} nama={nama} logo={`/demo/lambang/${slug}.svg`} ukuran={28} />
          ))}
          <Lambang nama="Bintang FC" ukuran={28} />
          <Lambang nama="Sail Muda" warna="#e46a1f" ukuran={28} />
        </div>
      </Seksi>

      <Seksi judul="05 · Avatar pemain">
        <div className="grid grid-cols-3 gap-6 md:grid-cols-6">
          {["rizky", "fajar", "dimas", "ilham", "bayu", "nadia", "eko", "putri", "rahmat", "sari", "yoga", "wulan"].map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-2 text-center">
              <AvatarPemain seed={s} nama={s} ukuran={88} jersey={["#123b2c", "#e46a1f", "#24507a", "#e3b52a"][i % 4]} label={i === 5 ? "ADMIN" : undefined} />
              <span className="text-sm font-extrabold capitalize">{s}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <AvatarTumpuk orang={["a", "b", "c", "d", "e", "f", "g"].map((s) => ({ seed: s, nama: s }))} />
          <div className="flex gap-2">
            {["a", "b", "c"].map((s) => (
              <AvatarPemain key={s} seed={s} nama={s} ukuran={32} />
            ))}
          </div>
        </div>
      </Seksi>

      <Seksi judul="06 · Kartu">
        <div className="grid gap-4 md:grid-cols-2">
          <Card interaktif tabIndex={0}>
            <CardHeader>
              <LabelSeksi>Bisa diklik</LabelSeksi>
              <CardTitle>Tepi hijau + bayangan 4px</CardTitle>
              <CardDescription>Ditekan: turun 4px, bayangan hilang.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <LabelSeksi>Info saja</LabelSeksi>
              <CardTitle>Tepi hijau, tanpa bayangan</CardTitle>
            </CardHeader>
            <CardContent className="flex-row items-center gap-3">
              <BadgeStatus status="terkonfirmasi" />
              <span className="text-sm text-teks-2">Sab, 31 Okt · 19.00</span>
            </CardContent>
          </Card>
          <KartuMemuat />
          <KartuKosong judul="Belum ada ajakan sparring" aksi={<Button>Cari Lawan</Button>}>
            Pak Bola sudah pemanasan. Cari club di Pekanbaru yang jadwalnya cocok.
          </KartuKosong>
        </div>
      </Seksi>

      <Seksi judul="07 · Navigasi">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-kartu border-2 border-nonaktif-tepi p-4">
            <HeaderHalaman judul="Cari Lawan" />
          </div>
          <div className="rounded-kartu border-2 border-nonaktif-tepi p-4">
            <HeaderHalaman judul="Detail Ajakan" kembali="/dev/komponen" />
          </div>
        </div>
        <Tabs defaultValue="masuk">
          <TabsList>
            <TabsTrigger value="masuk">Masuk <Hitungan jumlah={2} /></TabsTrigger>
            <TabsTrigger value="terkirim">Terkirim</TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
          </TabsList>
          <TabsContent value="masuk" className="text-sm text-teks-2">Isi tab Masuk.</TabsContent>
          <TabsContent value="terkirim" className="text-sm text-teks-2">Isi tab Terkirim.</TabsContent>
          <TabsContent value="riwayat" className="text-sm text-teks-2">Isi tab Riwayat.</TabsContent>
        </Tabs>
        <p className="text-sm text-teks-2">Navigasi bawah HP dan sidebar desktop tampil di halaman tiap peran (/club, /pemain, /platform).</p>
      </Seksi>

      <Seksi judul="08 · Umpan balik">
        <DemoToast />
        <div className="grid gap-4 md:grid-cols-2">
          <Banner jenis="tindakan" judul="Club belum ditandai siap" aksi={<Button variant="emas" size="k">Tandai Siap</Button>}>
            Lawan diberi tahu bila club belum siap pada H-1.
          </Banner>
          <Banner jenis="saran">Lengkapi profil club supaya lawan lebih percaya.</Banner>
          <Banner jenis="gagal" judul="Gagal menyimpan">Coba lagi sebentar.</Banner>
          <Banner jenis="koneksi">Sinyal hilang. Perubahan disimpan & dikirim saat online lagi.</Banner>
        </div>
        <div className="flex flex-wrap gap-4">
          <DemoDialog />
          <DemoSheet />
        </div>
      </Seksi>
    </main>
  );
}
