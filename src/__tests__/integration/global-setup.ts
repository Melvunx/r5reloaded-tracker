import { execFileSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../app/generated/prisma/client";
import { TEST_DATABASE_NAME, testDatabaseUrl } from "./urls";

/**
 * Prépare la base de test : la crée si besoin, applique les migrations et insère les armes.
 * Tourne une fois avant tous les fichiers de test. Rien ne touche à la base de l'application.
 */
export default async function setup() {
  try {
    process.loadEnvFile();
  } catch {
    // Pas de .env : on se rabat sur l'environnement
  }
  const adminUrl = process.env.DATABASE_URL ?? "postgresql://apex:apex@localhost:5432/apex_tracker";
  const testUrl = testDatabaseUrl(adminUrl);

  const admin = new PrismaClient({ adapter: new PrismaPg({ connectionString: adminUrl }) });
  try {
    const existing = await admin.$queryRaw<{ datname: string }[]>`SELECT datname FROM pg_database WHERE datname = ${TEST_DATABASE_NAME}`;
    if (existing.length === 0) await admin.$executeRawUnsafe(`CREATE DATABASE "${TEST_DATABASE_NAME}"`);
  } catch (error) {
    throw new Error(`PostgreSQL injoignable avec DATABASE_URL (lance « pnpm db:up » ?) : ${String(error)}`);
  } finally {
    await admin.$disconnect();
  }

  const env = { ...process.env, DATABASE_URL: testUrl };
  execFileSync("pnpm", ["prisma", "migrate", "deploy"], { env, stdio: "pipe" });
  execFileSync("pnpm", ["prisma", "db", "seed"], { env, stdio: "pipe" });
}
