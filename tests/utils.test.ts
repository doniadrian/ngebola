import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn dengan token Ngebola", () => {
  it("bayangan keras dan warna bayangan tidak saling membuang", () => {
    expect(cn("shadow-keras shadow-emas")).toBe("shadow-keras shadow-emas");
    expect(cn("shadow-keras", "shadow-keras-lg")).toBe("shadow-keras-lg");
    expect(cn("shadow-emas", "shadow-hijau")).toBe("shadow-hijau");
  });

  it("radius dan warna token digabung dengan benar", () => {
    expect(cn("rounded-tombol", "rounded-kartu")).toBe("rounded-kartu");
    expect(cn("bg-hijau", "bg-merah")).toBe("bg-merah");
    expect(cn("text-sm text-teks-2")).toBe("text-sm text-teks-2");
    expect(cn("border-2 border-hijau", "border-merah")).toBe("border-2 border-merah");
  });
});
