import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "./hash";
import { analyzeImportFile } from "./import-file";

const VERIF_LINE = "=== Aim Trainer v1.0 CSV Results Dump - Made by CafeFPS @CafeFPS === ";
const FILE_NAME = "aimtrainer_results_1792494390.txt";
const bytes = readFileSync(new URL(`../data/${FILE_NAME}`, import.meta.url));

function formData(entries: Record<string, string | File>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) form.set(key, value);
  return form;
}

const realFile = () => new File([bytes], FILE_NAME, { type: "text/plain" });

describe("analyzeImportFile", () => {
  it("analyse le vrai export : hash des octets bruts, date du nom de fichier, doublon écarté", async () => {
    const result = await analyzeImportFile(formData({ file: realFile() }), VERIF_LINE);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.fileName).toBe(FILE_NAME);
    expect(result.data.fileHash).toBe(sha256Hex(bytes));
    expect(result.data.playedAt.toISOString()).toBe("2026-10-20T11:06:30.000Z");
    expect(result.data.valid).toHaveLength(3);
    expect(result.data.duplicates).toHaveLength(1);
    expect(result.data.invalid).toEqual([]);
  });

  it("préfère la date saisie dans le formulaire", async () => {
    const result = await analyzeImportFile(formData({ file: realFile(), playedAt: "2026-10-01" }), VERIF_LINE);
    expect(result.success && result.data.playedAt).toEqual(new Date("2026-10-01"));
  });

  it("refuse une entrée qui n'est pas un FormData", async () => {
    expect(await analyzeImportFile({ file: realFile() }, VERIF_LINE)).toEqual({
      success: false,
      error: "Formulaire invalide",
    });
  });

  it("refuse l'absence de fichier, un mauvais type et une mauvaise signature", async () => {
    expect(await analyzeImportFile(formData({}), VERIF_LINE)).toEqual({
      success: false,
      error: "Aucun fichier sélectionné",
    });
    expect(await analyzeImportFile(formData({ file: new File(["x"], "export.csv") }), VERIF_LINE)).toEqual({
      success: false,
      error: "Le fichier doit être un .txt",
    });
    expect(await analyzeImportFile(formData({ file: new File(["autre\n"], "export.txt") }), VERIF_LINE)).toMatchObject({
      success: false,
      error: expect.stringContaining("signature R5Reloaded absente"),
    });
  });

  it("refuse une date de session dans le futur", async () => {
    expect(await analyzeImportFile(formData({ file: realFile(), playedAt: "2999-01-01" }), VERIF_LINE)).toEqual({
      success: false,
      error: "La date de la session ne peut pas être dans le futur",
    });
  });
});
