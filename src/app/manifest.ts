import type { MetadataRoute } from "next";

// Diperlukan agar Web Push bisa dipakai di iPhone (app dibuka dari Layar Utama).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ngebola — Sparring antar club",
    short_name: "Ngebola",
    description: "Cari lawan sparring, sepakati jadwal, catat skor, dan bangun reputasi club fun football.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2ede0",
    theme_color: "#123b2c",
    lang: "id",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
