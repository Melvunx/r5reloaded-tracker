import { prisma } from "@/lib/prisma";
import type { ManualChallengeData } from "@/schema/challenge";

/** Enregistre un challenge saisi à la main (hors lot d'import : `batchId` reste null). */
export function createManualChallenge(data: ManualChallengeData) {
  return prisma.challenge.create({ data: { ...data, source: "manual" }, select: { id: true } });
}
