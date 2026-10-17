import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { WEAPONS } from "../src/config/apex-weapons.config";
import { getWeaponAliases } from "../src/schema/weapon";

process.loadEnvFile();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  for (const weapon of WEAPONS) {
    const { name, slug, type } = weapon;
    const aliases = getWeaponAliases(weapon);
    await prisma.weapon.upsert({
      where: { id: slug },
      create: { id: slug, name, type, aliases },
      update: { name, type, aliases },
    });
  }

  // Armes retirées de la config : on ne supprime que celles sans challenge (la FK l'interdirait sinon)
  const { count } = await prisma.weapon.deleteMany({
    where: { id: { notIn: WEAPONS.map((weapon) => weapon.slug) }, challenges: { none: {} } },
  });

  process.stdout.write(`${WEAPONS.length} armes synchronisées, ${count} supprimée(s)\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
