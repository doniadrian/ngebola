import { ImageResponse } from "next/og";
import { NAMA_SITUS } from "@/lib/situs";

export const alt = "Ngebola: cari lawan sparring fun football di Pekanbaru";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Gambar pratinjau saat tautan dibagikan (WhatsApp, X, dll). Warna dari token docs/DESIGN.md.
export default function Image() {
  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-between bg-[#123b2c] p-16 text-[#f2ede0]">
        <div tw="flex items-center text-4xl font-bold text-[#c9a14a]">{NAMA_SITUS}</div>
        <div tw="flex flex-col">
          <div tw="text-7xl font-bold leading-tight">Cari lawan sparring fun football di Pekanbaru.</div>
          <div tw="mt-6 text-5xl font-bold text-[#c9a14a]">Hasil tercatat, reputasi terbukti.</div>
        </div>
        <div tw="flex text-3xl text-[#c8d3cb]">Gratis · Football 11v11 & mini soccer · Rating per format</div>
      </div>
    ),
    size,
  );
}
