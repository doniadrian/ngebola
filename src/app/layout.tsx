import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { DESKRIPSI_BERANDA, JUDUL_BERANDA, NAMA_SITUS, situsUrl } from "@/lib/situs";
import { Penyedia } from "./penyedia";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(situsUrl("/")),
  title: { default: JUDUL_BERANDA, template: "%s · Ngebola" },
  description: DESKRIPSI_BERANDA,
  applicationName: NAMA_SITUS,
  keywords: ["sparring fun football Pekanbaru", "cari lawan sparring", "mini soccer Pekanbaru", "football 11v11", "leaderboard club", "match terbuka"],
  openGraph: { type: "website", locale: "id_ID", siteName: NAMA_SITUS, title: JUDUL_BERANDA, description: DESKRIPSI_BERANDA },
  twitter: { card: "summary_large_image", title: JUDUL_BERANDA, description: DESKRIPSI_BERANDA },
};

export const viewport: Viewport = {
  themeColor: "#123b2c",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="min-h-dvh">
        <a
          href="#konten"
          className="sr-only z-[60] rounded-tombol bg-hijau px-4 py-3 font-bold text-krem focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Lewati ke konten
        </a>
        <Penyedia>{children}</Penyedia>
      </body>
    </html>
  );
}
