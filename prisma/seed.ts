import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { WEAPONS } from "../src/config/apex-weapons.config";

process.loadEnvFile();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Variantes d'écriture rencontrées dans les exports : "R-99", "r99", "r-99"…
function buildAliases(name: string, slug: string) {
  const lower = name.toLowerCase();
  return [...new Set([name, lower, lower.replace(/[-\s]/g, ""), slug])];
}

async function main() {
  for (const { name, slug, type } of WEAPONS) {
    const aliases = buildAliases(name, slug);
    await prisma.weapon.upsert({
      where: { id: slug },
      create: { id: slug, name, type, aliases },
      update: { name, type, aliases },
    });
  }

  process.stdout.write(`${WEAPONS.length} armes synchronisées\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
