import { prisma } from "@/lib/prisma";
import type { ManualChallengeData } from "@/schema/challenge";

/** Enregistre un challenge saisi à la main (hors lot d'import : `batchId` reste null). */
export function createManualChallenge(data: ManualChallengeData) {
  return prisma.challenge.create({
    data: { ...data, source: "manual" },
    select: { id: true },
  });
}

export const MANUAL_HISTORY_LIMIT = 20;

/** Dernières saisies manuelles, de la session la plus récente à la plus ancienne. */
export function listManualChallenges() {
  return prisma.challenge.findMany({
    where: { source: "manual" },
    orderBy: [{ playedAt: "desc" }, { createdAt: "desc" }],
    take: MANUAL_HISTORY_LIMIT,
    select: {
      id: true,
      challengeName: true,
      playedAt: true,
      shotsHit: true,
      totalShots: true,
      accuracy: true,
      weapon: { select: { name: true } },
    },
  });
}

/**
 * Supprime une saisie manuelle. Le filtre sur `source` empêche d'effacer à l'unité un challenge importé :
 * ceux-là s'annulent avec leur lot. Renvoie false si la saisie n'existe plus.
 */
export async function deleteManualChallenge(id: string) {
  const { count } = await prisma.challenge.deleteMany({ where: { id, source: "manual" } });
  return count > 0;
}
