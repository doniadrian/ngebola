"use client";

import { useEffect, type ReactNode } from "react";
import { IconContext } from "@phosphor-icons/react";
import { Toaster } from "@/components/ui/sonner";

const TAHAN_MS = 140;

/**
 * Efek tekan yang selalu terlihat: ketukan singkat di HP hanya memicu :active beberapa milidetik, sehingga animasinya
 * nyaris tak tampak. Di sini elemen yang ditekan diberi data-ditekan (varian Tailwind `tekan:`) dan ditahan minimal 140 ms.
 */
function EfekTekan() {
  useEffect(() => {
    let el: Element | null = null;
    let mulai = 0;
    const lepas = () => {
      const target = el;
      if (!target) return;
      el = null;
      window.setTimeout(() => target.removeAttribute("data-ditekan"), Math.max(0, TAHAN_MS - (performance.now() - mulai)));
    };
    const tekan = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.("a[href],button,[role=button],[data-tekan]");
      if (!t || (t as HTMLButtonElement).disabled || t.getAttribute("aria-disabled") === "true") return;
      lepas();
      el = t;
      mulai = performance.now();
      t.setAttribute("data-ditekan", "");
    };
    // React me-reset form setelah server action selesai, walau galat validasi: pilihan Radix (peran, area, level) dan isian
    // ikut hilang. Cegah reset, kecuali form yang memang perlu dikosongkan setelah sukses (data-boleh-reset).
    const tahanReset = (e: Event) => {
      if ((e.target as Element).hasAttribute("data-boleh-reset")) return;
      e.preventDefault();
      e.stopImmediatePropagation(); // pendengar reset milik Radix (radio/select) juga mengosongkan pilihan
    };
    document.addEventListener("reset", tahanReset, true);
    document.addEventListener("pointerdown", tekan, { passive: true });
    window.addEventListener("pointerup", lepas);
    window.addEventListener("pointercancel", lepas);
    window.addEventListener("dragend", lepas);
    return () => {
      document.removeEventListener("reset", tahanReset, true);
      document.removeEventListener("pointerdown", tekan);
      window.removeEventListener("pointerup", lepas);
      window.removeEventListener("pointercancel", lepas);
      window.removeEventListener("dragend", lepas);
    };
  }, []);
  return null;
}

// Ikon Phosphor di komponen klien: Bold secara bawaan (DESIGN.md). Komponen server memakai /ssr + weight="bold".
export function Penyedia({ children }: { children: ReactNode }) {
  return (
    <IconContext.Provider value={{ weight: "bold" }}>
      {children}
      <EfekTekan />
      <Toaster />
    </IconContext.Provider>
  );
}
