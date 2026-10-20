import { Prisma } from "@app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SensitivityFormData } from "@/schema/mouse-settings";

const NEWEST_FIRST = [{ effectiveFrom: "desc" }, { createdAt: "desc" }] as const;

/** Historique complet, du réglage le plus récent au plus ancien. */
export function listSensitivities() {
  return prisma.sensitivity.findMany({ orderBy: [...NEWEST_FIRST] });
}

export function createSensitivity(data: SensitivityFormData) {
  return prisma.sensitivity.create({ data });
}

/** Réglage actif à une date (même règle que `pickActive`) ; undefined avant le premier réglage saisi. */
export async function getSensitivityAt(date: Date) {
  return (await prisma.sensitivity.findFirst({ where: { effectiveFrom: { lte: date } }, orderBy: [...NEWEST_FIRST] })) ?? undefined;
}

/** Supprime un réglage ; renvoie false s'il n'existe pas (déjà supprimé). */
export async function deleteSensitivity(id: string) {
  try {
    await prisma.sensitivity.delete({ where: { id } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return false;
    throw error;
  }
}
