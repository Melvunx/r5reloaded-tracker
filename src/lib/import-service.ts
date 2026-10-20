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
