export const cookieJar = new Map<string, string>();

export class RedirectError extends Error {
  constructor(public url: string) {
    super(`REDIRECT ${url}`);
  }
}

/** Jalankan fungsi yang diharapkan memanggil redirect(); kembalikan URL tujuannya. */
export async function tangkapRedirect(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof RedirectError) return e.url;
    throw e;
  }
  throw new Error("Tidak ada redirect");
}

export function formData(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}
