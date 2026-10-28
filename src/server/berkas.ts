import "server-only";
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join, normalize } from "node:path";

export const MAKS_GAMBAR = 2 * 1024 * 1024; // 2 MB (PRD C-01, P-01)
export const AKAR_UNGGAHAN = process.env.UPLOAD_DIR ?? "uploads";
export const FOLDER = ["logo", "galeri", "pemain"] as const;
export type Folder = (typeof FOLDER)[number];

const JENIS = [
  { ext: "png", mime: "image/png", cocok: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "jpg", mime: "image/jpeg", cocok: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "webp", mime: "image/webp", cocok: (b: Buffer) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
];

export type HasilUnggah = { ok: true; path: string } | { ok: false; error: string };

/** Ambil File dari FormData; null bila tidak diisi. */
export const fileDari = (fd: FormData, key: string) => {
  const f = fd.get(key);
  return f instanceof File && f.size > 0 ? f : null;
};

/** Simpan gambar PNG/JPG/WebP ≤ 2 MB. Jenis dicek dari isi file (bukan nama/ekstensi). */
export async function simpanGambar(file: File, folder: Folder): Promise<HasilUnggah> {
  if (file.size > MAKS_GAMBAR) return { ok: false, error: "Ukuran gambar maksimal 2 MB." };
  const buf = Buffer.from(await file.arrayBuffer());
  const jenis = JENIS.find((j) => j.cocok(buf));
  if (!jenis) return { ok: false, error: "Format gambar harus PNG, JPG, atau WebP." };
  const nama = `${crypto.randomUUID()}.${jenis.ext}`;
  mkdirSync(join(AKAR_UNGGAHAN, folder), { recursive: true });
  writeFileSync(join(AKAR_UNGGAHAN, folder, nama), buf);
  return { ok: true, path: `/berkas/${folder}/${nama}` };
}

/** Lokasi file di disk untuk path "/berkas/<folder>/<nama>"; null bila tidak sah. */
export function lokasiBerkas(path: string): { file: string; folder: Folder; mime: string } | null {
  const m = /^\/berkas\/([a-z]+)\/([0-9a-f-]{36}\.(png|jpg|webp))$/.exec(path);
  if (!m || !FOLDER.includes(m[1] as Folder)) return null;
  const file = normalize(join(AKAR_UNGGAHAN, m[1], m[2]));
  return { file, folder: m[1] as Folder, mime: JENIS.find((j) => j.ext === m[3])!.mime };
}

export function bacaBerkas(path: string) {
  const l = lokasiBerkas(path);
  return l && existsSync(l.file) ? { ...l, isi: readFileSync(l.file) } : null;
}

export function hapusBerkas(path: string | null | undefined) {
  const l = path ? lokasiBerkas(path) : null;
  if (l && existsSync(l.file)) rmSync(l.file);
}
