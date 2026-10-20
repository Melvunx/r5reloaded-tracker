import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Les tests d'intégration tournent sur une base à part (`apex_tracker_test`) : jamais sur celle de l'application.
try {
  process.loadEnvFile();
} catch {
  // Pas de .env (CI) : les variables viennent de l'environnement
}
// Même nom que TEST_DATABASE_NAME dans src/__tests__/integration/urls.ts
const TEST_DATABASE_NAME = "apex_tracker_test";
const adminUrl = process.env.DATABASE_URL ?? "postgresql://apex:apex@localhost:5432/apex_tracker";

const testUrl = new URL(adminUrl);
testUrl.pathname = `/${TEST_DATABASE_NAME}`;

export default defineConfig({
  resolve: {
    alias: {
      "@app": fileURLToPath(new URL("./app", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    globalSetup: ["./src/__tests__/integration/global-setup.ts"],
    setupFiles: ["./src/__tests__/integration/setup.ts"],
    // Une seule base partagée : les fichiers de test passent l'un après l'autre
    fileParallelism: false,
    env: {
      DATABASE_URL: testUrl.toString(),
      VERIF_LINE: process.env.VERIF_LINE ?? "=== Aim Trainer v1.0 CSV Results Dump - Made by CafeFPS @CafeFPS === ",
    },
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
