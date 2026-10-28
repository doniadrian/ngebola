import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App ini hampir seluruhnya bergantung pada sesi; render dinamis biasa lebih sederhana daripada Cache Components.
  cacheComponents: false,
  serverExternalPackages: ["better-sqlite3"],
  // Indikator dev menutupi navigasi bawah saat audit tampilan.
  devIndicators: false,
  // Logo/foto maks 2 MB (PRD C-01, P-01) + ruang untuk overhead multipart.
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
