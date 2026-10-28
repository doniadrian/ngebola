// Masuk sekali klik untuk demo. Hanya aktif di development, atau di server lain bila DEMO_LOGIN=1 (jangan di production sungguhan).
export const DEMO_AKTIF = process.env.NODE_ENV !== "production" || process.env.DEMO_LOGIN === "1"

import { PEMAIN_AKTIF } from "./fitur"

const SEMUA = [
  { email: "club@ngebola.test", peran: "Admin club", sub: "Lancang Kuning FC" },
  { email: "pemain@ngebola.test", peran: "Pemain", sub: "Skuad Lancang Kuning", pemain: true },
  { email: "admin@ngebola.test", peran: "Admin platform", sub: "Verifikasi & sengketa" },
  { email: "pemain.baru@ngebola.test", peran: "Pemain baru", sub: "Belum punya club", pemain: true },
  { email: "kulim@ngebola.test", peran: "Club diajukan", sub: "Menunggu verifikasi" },
] as const

export const AKUN_DEMO = SEMUA.filter((a) => PEMAIN_AKTIF || !("pemain" in a))
