import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/kosong.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Hash scrypt untuk banyak akun bisa lambat saat file tes berjalan paralel.
    testTimeout: 30_000,
    env: { DATABASE_PATH: ":memory:", EMAIL_MODE: "demo", FITUR_PEMAIN: "1" },
  },
});
