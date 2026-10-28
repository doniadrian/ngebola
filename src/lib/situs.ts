// URL publik situs (untuk canonical, sitemap, Open Graph, JSON-LD). Production wajib mengisi APP_URL dengan HTTPS.
export const situsUrl = (path = "/") => `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;

export const NAMA_SITUS = "Ngebola";
export const JUDUL_BERANDA = "Ngebola: Cari Lawan Sparring Fun Football di Pekanbaru";
export const DESKRIPSI_BERANDA =
  "Platform sparring antar club fun football di Pekanbaru. Cari lawan setara, atur jadwal & lapangan, catat skor, dan bangun rating club dari hasil yang dikonfirmasi dua club. Gratis.";

/** Aman disisipkan di <script type="application/ld+json">: karakter "<" di-escape agar tidak bisa menutup tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
