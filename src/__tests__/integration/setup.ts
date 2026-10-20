import { afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { TEST_DATABASE_NAME } from "./urls";

// Garde-fou : ces tests vident les tables, ils ne doivent jamais tourner sur la vraie base
const databaseName = new URL(process.env.DATABASE_URL ?? "postgresql://x/none").pathname.slice(1);
if (databaseName !== TEST_DATABASE_NAME) {
  throw new Error(`Les tests d'intégration exigent la base « ${TEST_DATABASE_NAME} » (reçu : « ${databaseName} »)`);
}

// Les armes (créées par le seed) restent ; tout le reste repart de zéro avant chaque test
beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "challenges", "import_batches", "sensitivities" RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await prisma.$disconnect();
});
