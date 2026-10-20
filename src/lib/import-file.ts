import { parseR5Export, type InvalidLine, type ParsedLine } from "@/lib/r5-parser";
import { sha256Hex } from "@/lib/hash";
import type { ActionResult } from "@/lib/action-result";
import { ImportFormSchema } from "@/schema/import";

export type ImportAnalysis = {
  fileName: string;
  fileHash: string;
  playedAt: Date;
  valid: ParsedLine[];
  invalid: InvalidLine[];
  duplicates: ParsedLine[];
};

/**
 * Lit le formulaire d'import (`file` + `playedAt`) puis analyse le fichier : hash, signature, lignes.
 * Ne touche pas à la base : sert à l'aperçu comme à la confirmation, qui ré-analysent le même fichier
 * plutôt que de faire confiance à des données renvoyées par le client.
 */
export async function analyzeImportFile(input: unknown, verifLine: string): Promise<ActionResult<ImportAnalysis>> {
  if (!(input instanceof FormData)) return { success: false, error: "Formulaire invalide" };

  const form = ImportFormSchema.safeParse({ file: input.get("file"), playedAt: input.get("playedAt") });
  if (!form.success) return { success: false, error: form.error.issues.map((issue) => issue.message).join(" ; ") };

  const { file, playedAt } = form.data;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const parsed = parseR5Export(new TextDecoder("utf-8").decode(bytes), verifLine);
  if (!parsed.success) return { success: false, error: parsed.error };

  return {
    success: true,
    data: {
      fileName: file.name,
      fileHash: sha256Hex(bytes),
      playedAt,
      valid: parsed.valid,
      invalid: parsed.invalid,
      duplicates: parsed.duplicates,
    },
  };
}
