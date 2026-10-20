import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseR5Export } from "./r5-parser";

const VERIF_LINE = "=== Aim Trainer v1.0 CSV Results Dump - Made by CafeFPS @CafeFPS === ";
const HEADERS = "ChallengeName, ShotsHit, Kills, Weapon, Accuracy, Damage, CriticalShots, TotalShots, Roundtime ";
const ROW = "STRAFING DUMMY, 193, 19, Flatline, 46.61%, 3888, 8, 414, 60";

const realExport = readFileSync(new URL("../data/aimtrainer_results_1792494390.txt", import.meta.url), "utf-8");

describe("parseR5Export sur un vrai export R5Reloaded", () => {
  const result = parseR5Export(realExport, VERIF_LINE);

  it("lit les lignes de données (fins de ligne \\r\\n, ligne vide, espaces) et écarte le doublon", () => {
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.invalid).toEqual([]);
    expect(result.valid.map((line) => line.lineNumber)).toEqual([4, 5, 6]);
    expect(result.duplicates.map((line) => line.lineNumber)).toEqual([7]);
    expect(result.valid[0].data).toEqual({
      challengeName: "STRAFING DUMMY",
      weaponId: "flatline",
      shotsHit: 193,
      totalShots: 414,
      criticalShots: 8,
      kills: 19,
      damage: 3888,
      accuracy: 46.62,
      roundtime: 60,
    });
    expect(result.valid.map((line) => line.data.weaponId)).toEqual(["flatline", "volt", "volt"]);
  });
});

describe("parseR5Export", () => {
  const file = (...lines: string[]) => lines.join("\r\n");

  it("refuse un fichier sans la signature", () => {
    expect(parseR5Export(file("autre chose", HEADERS, ROW), VERIF_LINE)).toEqual({
      success: false,
      error: "Ligne 1 : signature R5Reloaded absente, ce fichier n'est pas un export valide",
    });
  });

  it("accepte une signature sans l'espace final et un BOM", () => {
    const text = "﻿" + file(VERIF_LINE.trim(), "", HEADERS, ROW);
    expect(parseR5Export(text, VERIF_LINE)).toMatchObject({ success: true });
  });

  it("refuse un fichier sans en-têtes ou avec des en-têtes manquants", () => {
    expect(parseR5Export(VERIF_LINE, VERIF_LINE)).toEqual({
      success: false,
      error: "Le fichier ne contient pas d'en-têtes",
    });
    expect(parseR5Export(file(VERIF_LINE, "ChallengeName, Kills", ROW), VERIF_LINE)).toMatchObject({
      success: false,
      error: expect.stringContaining("Ligne 2 : en-têtes manquants (ShotsHit, Weapon"),
    });
  });

  it("sépare lignes valides et invalides avec les vrais numéros de ligne", () => {
    const text = file(
      VERIF_LINE,
      "",
      HEADERS,
      ROW,
      "STRAFING DUMMY, 193, 19, Bocek, 46.61%, 3888, 8, 414, 60",
      "",
      "STRAFING DUMMY, 193, 19, Volt, 99%, 3888, 8, 414, 60",
      "STRAFING DUMMY, 1, 2",
    );
    const result = parseR5Export(text, VERIF_LINE);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.valid.map((line) => line.lineNumber)).toEqual([4]);
    expect(result.invalid.map((line) => line.lineNumber)).toEqual([5, 7, 8]);
    expect(result.invalid[0].errors).toEqual(["Ligne 5 : Arme inconnue : « Bocek »"]);
    expect(result.invalid[1].errors[0]).toMatch(/^Ligne 7 : La précision \(99 %\) ne correspond pas/);
    expect(result.invalid[2].errors).toEqual(["Ligne 8 : 9 colonnes attendues, 3 trouvées"]);
  });

  it("gère un nom de challenge entre guillemets avec une virgule", () => {
    const text = file(VERIF_LINE, HEADERS, '"STRAFING DUMMY, v2", 193, 19, Flatline, 46.61%, 3888, 8, 414, 60');
    const result = parseR5Export(text, VERIF_LINE);
    expect(result.success && result.valid[0].data.challengeName).toBe("STRAFING DUMMY, v2");
  });

  it("accepte des colonnes dans un autre ordre", () => {
    const text = file(VERIF_LINE, "Weapon,ChallengeName,ShotsHit,Kills,Accuracy,Damage,CriticalShots,TotalShots,Roundtime", "Volt,TEST,50,1,50%,900,5,100,30");
    const result = parseR5Export(text, VERIF_LINE);
    expect(result.success && result.valid[0].data).toMatchObject({ weaponId: "volt", challengeName: "TEST", accuracy: 50 });
  });

  it("met les lignes identiques dans duplicates, mais garde deux parties aux valeurs différentes", () => {
    const other = "STRAFING DUMMY, 194, 19, Flatline, 46.86%, 3888, 8, 414, 60";
    const result = parseR5Export(file(VERIF_LINE, HEADERS, ROW, other, ROW, ROW), VERIF_LINE);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.valid.map((line) => line.lineNumber)).toEqual([3, 4]);
    expect(result.duplicates.map((line) => line.lineNumber)).toEqual([5, 6]);
  });

  it("renvoie zéro ligne pour un fichier avec en-têtes seuls", () => {
    expect(parseR5Export(file(VERIF_LINE, "", HEADERS, ""), VERIF_LINE)).toEqual({ success: true, valid: [], invalid: [], duplicates: [] });
  });
});
