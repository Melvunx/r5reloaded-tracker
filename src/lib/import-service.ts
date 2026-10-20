import { Prisma } from "@app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ImportAnalysis } from "@/lib/import-file";

export function findBatchByHash(fileHash: string) {
  return prisma.importBatch.findUnique({ where: { fileHash }, select: { id: true, fileName: true, importedAt: true } });
}

/**
 * Crée le lot et ses challenges en une seule requête (donc atomique : tout ou rien).
 * Renvoie null si le fichier a été importé entre-temps (contrainte unique sur `fileHash`).
 */
export async function createImportBatch({ fileName, fileHash, playedAt, valid }: ImportAnalysis) {
  try {
    const batch = await prisma.importBatch.create({
      data: {
        fileName,
        fileHash,
        challenges: {
          createMany: { data: valid.map(({ data }) => ({ ...data, playedAt, source: "import" })) },
        },
      },
      select: { id: true },
    });
    return { id: batch.id, inserted: valid.length };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
    throw error;
  }
}

export const HISTORY_LIMIT = 20;

/** Derniers imports, du plus récent au plus ancien. Tous les challenges d'un lot partagent la même `playedAt`. */
export async function listImportBatches() {
  const batches = await prisma.importBatch.findMany({
    orderBy: { importedAt: "desc" },
    take: HISTORY_LIMIT,
    select: {
      id: true,
      fileName: true,
      importedAt: true,
      _count: { select: { challenges: true } },
      challenges: { select: { playedAt: true }, take: 1 },
    },
  });
  return batches.map(({ id, fileName, importedAt, _count, challenges }) => ({
    id,
    fileName,
    importedAt,
    challengeCount: _count.challenges,
    playedAt: challenges[0]?.playedAt ?? null,
  }));
}

/**
 * Supprime un lot ; ses challenges partent avec lui (`onDelete: Cascade`).
 * Renvoie le nombre de challenges supprimés, ou null si le lot n'existe pas (déjà annulé).
 */
export async function removeImportBatch(id: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const challengeCount = await tx.challenge.count({ where: { batchId: id } });
      await tx.importBatch.delete({ where: { id } });
      return challengeCount;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
    throw error;
  }
}
