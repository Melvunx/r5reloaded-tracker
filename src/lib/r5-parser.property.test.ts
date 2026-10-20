import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { parseR5Export } from "./r5-parser";

const SIGNATURE = "=== Aim Trainer v1.0 CSV Results Dump ===";
const HEADER = "ChallengeName, ShotsHit, Kills, Weapon, Accuracy, Damage, CriticalShots, TotalShots, Roundtime ";

type Row = { hit: number; total: number; crit: number; kills: number; damage: number; roundtime: number; weapon: string };

// Parties cohérentes : touchés <= tirs, critiques <= touchés
const row: fc.Arbitrary<Row> = fc
  .record({
    total: fc.integer({ min: 1, max: 2000 }),
    kills: fc.integer({ min: 0, max: 60 }),
    damage: fc.integer({ min: 0, max: 20000 }),
    roundtime: fc.integer({ min: 1, max: 600 }),
    weapon: fc.constantFrom("Volt", "R-99", "Flatline", "Triple Take", "G7 Scout", "L-STAR"),
  })
  .chain((base) =>
    fc
      .integer({ min: 0, max: base.total })
      .chain((hit) => fc.integer({ min: 0, max: hit }).map((crit) => ({ ...base, hit, crit }))),
  );

const toLine = ({ hit, total, crit, kills, damage, roundtime, weapon }: Row) =>
  `STRAFING DUMMY, ${hit}, ${kills}, ${weapon}, ${((hit / total) * 100).toFixed(2)}%, ${damage}, ${crit}, ${total}, ${roundtime}`;

const buildExport = (lines: string[], eol: string) => [SIGNATURE, "", HEADER, ...lines].join(eol) + eol;

describe("parseR5Export (propriétés)", () => {
  it("ne plante jamais sur un texte quelconque", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), (text) => {
        const result = parseR5Export(text, SIGNATURE);
        expect(typeof result.success).toBe("boolean");
      }),
    );
  });

  it("ne plante pas non plus quand la signature et les en-têtes sont bons mais les données sont du bruit", () => {
    fc.assert(
      fc.property(fc.array(fc.string({ unit: "binary" }), { maxLength: 20 }), (noise) => {
        const result = parseR5Export(buildExport(noise, "\r\n"), SIGNATURE);
        expect(result.success).toBe(true);
      }),
    );
  });

  it("classe chaque ligne de données exactement une fois (valide, invalide ou doublon)", () => {
    fc.assert(
      fc.property(fc.array(row, { minLength: 1, maxLength: 15 }), fc.constantFrom("\n", "\r\n"), (rows, eol) => {
        const lines = rows.map(toLine);
        const result = parseR5Export(buildExport(lines, eol), SIGNATURE);
        if (!result.success) throw new Error(result.error);

        expect(result.invalid).toEqual([]);
        expect(result.valid.length + result.duplicates.length).toBe(lines.length);
        // Le texte d'une ligne identique ne donne qu'une seule ligne valide
        expect(result.valid.length).toBe(new Set(lines).size);
      }),
    );
  });

  it("conserve la précision cohérente avec les tirs (recalculée, arrondie à 2 décimales)", () => {
    fc.assert(
      fc.property(fc.array(row, { minLength: 1, maxLength: 10 }), (rows) => {
        const result = parseR5Export(buildExport(rows.map(toLine), "\r\n"), SIGNATURE);
        if (!result.success) throw new Error(result.error);
        for (const { data } of result.valid) {
          // Arrondi à 2 décimales : l'écart maximal est une demi-unité de la 2e décimale (0,005)
          expect(Math.abs(data.accuracy - (data.shotsHit / data.totalShots) * 100)).toBeLessThanOrEqual(0.005 + 1e-9);
        }
      }),
    );
  });

  it("signale une ligne corrompue avec son numéro réel dans le fichier, sans toucher aux autres", () => {
    fc.assert(
      fc.property(
        fc.array(row, { minLength: 2, maxLength: 10 }),
        fc.nat(),
        fc.constantFrom("\n", "\r\n"),
        (rows, seed, eol) => {
          // Lignes rendues uniques pour que les doublons ne faussent pas le décompte
          const lines = rows.map((r, i) => toLine({ ...r, damage: r.damage + i * 100_000 }));
          const broken = seed % lines.length;
          lines[broken] = lines[broken].replace(/,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*$/, ", x");

          const result = parseR5Export(buildExport(lines, eol), SIGNATURE);
          if (!result.success) throw new Error(result.error);

          // signature = ligne 1, ligne vide = 2, en-têtes = 3, données à partir de la 4
          expect(result.invalid.map((line) => line.lineNumber)).toEqual([4 + broken]);
          expect(result.valid).toHaveLength(lines.length - 1);
        },
      ),
    );
  });

  it("refuse tout fichier dont la signature est absente", () => {
    fc.assert(
      fc.property(fc.string().filter((text) => !text.includes("CSV Results Dump")), (text) => {
        expect(parseR5Export(text, SIGNATURE).success).toBe(false);
      }),
    );
  });
});
