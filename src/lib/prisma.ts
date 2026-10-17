import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@app/generated/prisma/client";
import { env } from "@/lib/env";

// Un seul client en dev : le hot reload ré-exécute ce module et ouvrirait sinon de nouvelles connexions à chaque fois
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
