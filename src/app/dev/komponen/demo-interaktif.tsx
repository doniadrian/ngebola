"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function DemoToast() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="garis" size="k" onClick={() => toast.berhasil(<><b>Ajakan terkirim</b> ke Garuda Sail FC</>, { action: { label: "Lihat", onClick: () => {} } })}>
        Toast berhasil
      </Button>
      <Button variant="garis" size="k" onClick={() => toast.urungkan("Pesan disembunyikan dari chat", () => toast.info("Pesan ditampilkan lagi"))}>
        Toast urungkan
      </Button>
      <Button variant="garis" size="k" onClick={() => toast.gagal(<><b>Gagal menyimpan.</b> Sinyal putus.</>, { action: { label: "Coba lagi", onClick: () => {} } })}>
        Toast gagal
      </Button>
      <Button variant="garis" size="k" onClick={() => toast.info("Pengingat dikirim ke 6 anggota")}>
        Toast info
      </Button>
    </div>
  );
}

export function DemoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="bahaya">Batalkan Match</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batalkan sparring?</DialogTitle>
          <DialogDescription>
            Garuda Sail FC langsung diberi tahu. Karena kurang dari 24 jam sebelum kick-off, skor keandalan club kamu turun.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="bahaya">Ya, Batalkan Match</Button>
          <DialogClose asChild>
            <Button variant="garis">Jangan, Tetap Main</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const HARI = [
  { h: "RAB", t: 4, coret: true },
  { h: "KAM", t: 5 },
  { h: "SAB", t: 7 },
  { h: "MIN", t: 8 },
];

export function DemoSheet() {
  const [hari, setHari] = useState(7);
  const [jam, setJam] = useState("19.00");
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="garis">Tawar Jadwal</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tawar jadwal</SheetTitle>
          <SheetDescription>
            Marpoyan Damai FC minta <b className="text-tinta">Rab, 4 Nov · 20.00</b>
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold">Hari</span>
          <div className="flex gap-2">
            {HARI.map((d) => {
              const on = hari === d.t;
              return (
                <button
                  key={d.t}
                  type="button"
                  aria-pressed={on}
                  disabled={d.coret}
                  onClick={() => setHari(d.t)}
                  className={cn(
                    "flex flex-1 flex-col items-center rounded-tombol border-2 py-2 outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-hijau",
                    on ? "border-hijau bg-hijau text-krem shadow-keras-sm shadow-emas" : "border-hijau bg-krem-terang text-tinta",
                    d.coret && "border-nonaktif-tepi"
                  )}
                >
                  <span className={cn("text-[11px] font-extrabold", on ? "text-emas" : "text-teks-2")}>{d.h}</span>
                  <span className={cn("text-lg font-extrabold", d.coret && "line-through decoration-merah decoration-2")}>{d.t}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold">Jam</span>
          <div className="flex flex-wrap gap-2">
            {["16.00", "19.00", "21.00"].map((j) => (
              <button
                key={j}
                type="button"
                aria-pressed={jam === j}
                onClick={() => setJam(j)}
                className={cn(
                  "h-10 rounded-full border-2 border-hijau px-3.5 text-sm font-bold outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-hijau",
                  jam === j ? "bg-emas text-tinta" : "bg-krem-terang text-hijau"
                )}
              >
                {j}
              </button>
            ))}
          </div>
        </div>
        <Button size="b" className="w-full">
          Kirim Tawaran · Sab {hari}, {jam}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

export function DemoTextarea() {
  const [teks, setTeks] = useState("Bawa rompi 2 warna ya, kami sedia bola & air minum.");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="catatan" className="text-sm font-bold">
        Catatan untuk lawan <span className="font-semibold text-teks-2">(opsional)</span>
      </label>
      <Textarea id="catatan" maxLength={200} value={teks} onChange={(e) => setTeks(e.target.value)} />
      <span className="self-end text-xs font-bold text-teks-2">{teks.length} / 200</span>
    </div>
  );
}
