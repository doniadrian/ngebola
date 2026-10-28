import type { MetadataRoute } from "next";
import { situsUrl } from "@/lib/situs";

// Area privat (butuh login) dan rute teknis tidak untuk diindeks.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/club/", "/pemain/", "/platform/", "/api/", "/dev/", "/undangan/", "/reset-password/", "/berkas/", "/buka/", "/masuk", "/daftar", "/lupa-password"] },
    sitemap: situsUrl("/sitemap.xml"),
  };
}
