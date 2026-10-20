"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { env } from "@/lib/env";
import { analyzeImportFile, type ImportAnalysis } from "@/lib/import-file";
import { createImportBatch, findBatchByHash, removeImportBatch } from "@/lib/import-service";
import { DeleteImportSchema } from "@/schema/import";

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

    revalidatePath("/dashboard");
    revalidatePath("/import");
    return { success: true, data: { batchId: created.id, inserted: created.inserted } };
  } catch (error) {
    console.error("confirmImport", error);
    return { success: false, error: "Erreur serveur pendant l'import" };
  }
}

/** Annule un import : supprime le lot et ses challenges. Le fichier redevient importable (son hash disparaît). */
export async function deleteImportBatch(input: unknown): Promise<ActionResult<{ deleted: number }>> {
  const parsed = DeleteImportSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const deleted = await removeImportBatch(parsed.data.id);
    if (deleted === null) return { success: false, error: "Cet import n'existe plus" };

    revalidatePath("/dashboard");
    revalidatePath("/import");
    return { success: true, data: { deleted } };
  } catch (error) {
    console.error("deleteImportBatch", error);
    return { success: false, error: "Erreur serveur pendant l'annulation de l'import" };
  }
}
