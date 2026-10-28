import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { TrashIcon } from "@phosphor-icons/react/ssr";
import { DialogAlasan } from "@/components/ngebola/dialog-alasan";
import { FormLapangan, FormSlot } from "@/components/ngebola/form-lapangan";
import { NAMA_HARI } from "@/db/enums";
import { HeaderHalaman } from "@/components/ngebola/header";
import { Card, LabelSeksi } from "@/components/ui/card";
import { db } from "@/db";
import { venues, venueSlots } from "@/db/schema";
import { requireRole } from "@/server/authz";

export const metadata: Metadata = { title: "Ubah lapangan" };

export default async function Page({ params }: PageProps<"/platform/lapangan/[id]">) {
  await requireRole("platform_admin");
  const { id } = await params;
  const v = db.select().from(venues).where(eq(venues.id, id)).get();
  if (!v) notFound();
  const slot = db.select().from(venueSlots).where(eq(venueSlots.venueId, id)).orderBy(asc(venueSlots.dayOfWeek), asc(venueSlots.startTime)).all();
  return (
    <>
      <HeaderHalaman judul={v.name} kembali="/platform/lapangan" />
      <Card>
        <FormLapangan id={v.id} awal={v} />
      </Card>
      <Card>
        <LabelSeksi>Info slot (tidak bisa dipesan)</LabelSeksi>
        {slot.length ? (
          <ul className="flex flex-col gap-2">
            {slot.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-tombol border-2 border-nonaktif-tepi px-3.5 py-2 text-sm">
                <span className="flex-1">
                  <b>{NAMA_HARI[s.dayOfWeek]}</b> {s.startTime.replace(":", ".")}–{s.endTime.replace(":", ".")}
                  {s.note ? ` · ${s.note}` : ""}
                </span>
                <DialogAlasan
                  jenis="hapus-slot"
                  targetId={s.id}
                  pemicu={<TrashIcon weight="bold" aria-label="Hapus slot" />}
                  varianPemicu="teks"
                  min={3}
                  bahaya
                  judul="Hapus slot ini?"
                  deskripsi="Slot hanya informasi; tidak ada pemesanan yang terdampak."
                  label="Hapus Slot"
                  berhasil="Slot dihapus"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-teks-2">Belum ada slot.</p>
        )}
        <FormSlot venueId={v.id} />
      </Card>
    </>
  );
}
