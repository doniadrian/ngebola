/** "Lancang Kuning FC" → "lancang-kuning-fc" */
export const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "club";

/** Inisial lambang otomatis: "Lancang Kuning FC" → "LK", "Garuda" → "GA". */
export function inisialDari(nama: string) {
  const kata = nama.replace(/\b(FC|SC|United|Utd)\b/gi, "").trim().split(/\s+/).filter(Boolean);
  return ((kata[0]?.[0] ?? "") + (kata[1]?.[0] ?? kata[0]?.[1] ?? "")).toUpperCase() || "FC";
}

/** Kunci nama untuk cek unik per kota: tanpa spasi/tanda baca/huruf besar. */
export const kunciNama = (s: string) => slugify(s).replace(/-/g, "");
