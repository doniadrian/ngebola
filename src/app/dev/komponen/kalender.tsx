"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";

export function CalendarInline() {
  const [tgl, setTgl] = useState<Date | undefined>(new Date(2026, 9, 31));
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold">Kalender</span>
      <div className="self-start rounded-popover border-2 border-hijau bg-krem-terang p-4 shadow-keras-xl">
        <Calendar mode="single" selected={tgl} onSelect={setTgl} defaultMonth={new Date(2026, 9, 1)} />
      </div>
    </div>
  );
}
