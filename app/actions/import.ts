"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { env } from "@/lib/env";
import { analyzeImportFile, type ImportAnalysis } from "@/lib/import-file";
import { createImportBatch, findBatchByHash } from "@/lib/import-service";

const ALREADY_IMPORTED = (fileName: string, importedAt: Date) =>
  `Ce fichier a déjà été importé (« ${fileName} », le ${importedAt.toLocaleDateString("fr-FR")})`;

/** 1er temps : analyse le fichier sans rien écrire en base, pour l'aperçu (lignes valides / invalides / doublons). */
export async function previewImport(input: unknown): Promise<ActionResult<ImportAnalysis>> {
  try {
    const analysis = await analyzeImportFile(input, env.VERIF_LINE);
    if (!analysis.success) return analysis;

    const existing = await findBatchByHash(analysis.data.fileHash);
    if (existing) return { success: false, error: ALREADY_IMPORTED(existing.fileName, existing.importedAt) };

    return analysis;
  } catch (error) {
    console.error("previewImport", error);
    return { success: false, error: "Erreur serveur pendant l'analyse du fichier" };
  }
}

/** 2e temps : ré-analyse le même fichier (le client ne renvoie que le fichier et la date) puis insère le lot. */
export async function confirmImport(input: unknown): Promise<ActionResult<{ batchId: string; inserted: number }>> {
  try {
    const analysis = await analyzeImportFile(input, env.VERIF_LINE);
    if (!analysis.success) return analysis;
    if (analysis.data.valid.length === 0) return { success: false, error: "Aucune ligne valide à importer" };

    const existing = await findBatchByHash(analysis.data.fileHash);
    if (existing) return { success: false, error: ALREADY_IMPORTED(existing.fileName, existing.importedAt) };

    const created = await createImportBatch(analysis.data);
    if (!created) return { success: false, error: "Ce fichier vient d'être importé" };

    revalidatePath("/");
    revalidatePath("/import");
    return { success: true, data: { batchId: created.id, inserted: created.inserted } };
  } catch (error) {
    console.error("confirmImport", error);
    return { success: false, error: "Erreur serveur pendant l'import" };
  }
}
