import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@app": fileURLToPath(new URL("./app", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Les tests d'intégration ont besoin de PostgreSQL : ils ont leur propre commande (`pnpm test:integration`)
    exclude: ["src/**/*.integration.test.{ts,tsx}", "node_modules/**"],
  },
});
