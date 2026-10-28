/** Teks krem di atas warna gelap, tinta di atas warna terang (kontras ≥ 4.5:1 untuk warna club bebas). */
export function warnaTeksDi(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return "#f2ede0"
  const n = parseInt(m[1], 16)
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  // Bandingkan kontras terhadap krem (#f2ede0, L≈0.84) dan tinta (#14201a, L≈0.014).
  const kontrasKrem = (0.84 + 0.05) / (L + 0.05)
  const kontrasTinta = (L + 0.05) / (0.014 + 0.05)
  return kontrasKrem >= kontrasTinta ? "#f2ede0" : "#14201a"
}

export const terang = (hex: string) => warnaTeksDi(hex) === "#14201a"

// Pilihan warna club (jersey/lambang) yang tetap senada dengan palet.
export const WARNA_CLUB = [
  { nama: "Hijau lapangan", hex: "#123b2c" },
  { nama: "Hijau daun", hex: "#1f6b45" },
  { nama: "Toska", hex: "#1d7a77" },
  { nama: "Biru laut", hex: "#24507a" },
  { nama: "Merah bata", hex: "#a8382a" },
  { nama: "Jingga", hex: "#e46a1f" },
  { nama: "Kuning lancang", hex: "#e3b52a" },
  { nama: "Emas", hex: "#c9a14a" },
  { nama: "Ungu", hex: "#5b3f8c" },
  { nama: "Hitam", hex: "#14201a" },
  { nama: "Krem", hex: "#f2ede0" },
  { nama: "Putih", hex: "#fbf8f1" },
] as const
