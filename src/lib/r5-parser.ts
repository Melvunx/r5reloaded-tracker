import { parseCsv } from "./csv";
import { R5_HEADERS, parseImportRow, type ImportLineResult } from "@/schema/import";

export type ParsedLine = Extract<ImportLineResult, { success: true }>;
export type InvalidLine = Extract<ImportLineResult, { success: false }>;

export type ParseR5Result =
  | { success: true; valid: ParsedLine[]; invalid: InvalidLine[]; duplicates: ParsedLine[] }
  | { success: false; error: string };

/**
 * Lit un export R5Reloaded (texte déjà décodé) :
 *   ligne 1 : signature contenant `verifLine` ; lignes vides tolérées ; puis les en-têtes ; puis les données.
 * Une ligne strictement identique à une ligne précédente (mêmes valeurs partout) est un doublon : elle va dans
 * `duplicates` et n'est pas insérée. Les espaces autour des cellules sont ignorés (l'export écrit `a, b, c`). Les numéros de ligne des erreurs
 * sont ceux du fichier, lignes vides comprises.
 */
export function parseR5Export(text: string, verifLine: string): ParseR5Result {
  const content = text.replace(/^﻿/, "");

  const newline = /\r?\n/.exec(content);
  const signature = newline ? content.slice(0, newline.index) : content;
  if (!signature.includes(verifLine.trim())) {
    return { success: false, error: "Ligne 1 : signature R5Reloaded absente, ce fichier n'est pas un export valide" };
  }

  // Le CSV démarre après la signature ; on rétablit le décalage pour garder les vrais numéros de ligne
  const [headerRecord, ...rows] = parseCsv(newline ? content.slice(newline.index + newline[0].length) : "").map(
    (record) => ({ ...record, line: record.line + 1, cells: record.cells.map((cell) => cell.trim()) }),
  );

  if (!headerRecord) return { success: false, error: "Le fichier ne contient pas d'en-têtes" };

  const missing = R5_HEADERS.filter((header) => !headerRecord.cells.includes(header));
  if (missing.length > 0) {
    return {
      success: false,
      error: `Ligne ${headerRecord.line} : en-têtes manquants (${missing.join(", ")})`,
    };
  }

  const valid: ParsedLine[] = [];
  const invalid: InvalidLine[] = [];
  const duplicates: ParsedLine[] = [];
  const seen = new Set<string>();

  for (const { line, cells } of rows) {
    if (cells.length !== headerRecord.cells.length) {
      invalid.push({
        success: false,
        lineNumber: line,
        errors: [`Ligne ${line} : ${headerRecord.cells.length} colonnes attendues, ${cells.length} trouvées`],
      });
      continue;
    }
    const raw = Object.fromEntries(headerRecord.cells.map((header, index) => [header, cells[index]]));
    const result = parseImportRow(line, raw);
    if (!result.success) {
      invalid.push(result);
      continue;
    }
    // Sérialisé dans l'ordre des clés du schéma : deux lignes identiques donnent la même clé
    const key = JSON.stringify(result.data);
    if (seen.has(key)) duplicates.push(result);
    else {
      seen.add(key);
      valid.push(result);
    }
  }

  return { success: true, valid, invalid, duplicates };
}
