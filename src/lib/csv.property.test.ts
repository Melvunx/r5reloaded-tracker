import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

const quote = (cell: string) => `"${cell.replace(/"/g, '""')}"`;

describe("parseCsv (propriétés)", () => {
  it("ne plante jamais, quelle que soit l'entrée", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), (text) => {
        expect(() => parseCsv(text)).not.toThrow();
      }),
    );
  });

  it("renvoie des numéros de ligne strictement croissants et à partir de 1", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const lines = parseCsv(text).map((record) => record.line);
        expect(lines.every((line) => line >= 1)).toBe(true);
        expect(lines).toEqual([...lines].sort((a, b) => a - b));
        expect(new Set(lines).size).toBe(lines.length);
      }),
    );
  });

  it("restitue exactement les cellules après un encodage entre guillemets (virgules, guillemets, retours à la ligne)", () => {
    // Une ligne réduite à une seule cellule vide est ignorée par le parser : on ne la génère pas
    const row = fc.array(fc.string({ unit: "binary" }), { minLength: 2, maxLength: 6 });
    fc.assert(
      fc.property(fc.array(row, { minLength: 1, maxLength: 8 }), fc.constantFrom("\n", "\r\n"), (rows, eol) => {
        const text = rows.map((cells) => cells.map(quote).join(",")).join(eol);
        expect(parseCsv(text).map((record) => record.cells)).toEqual(rows);
      }),
    );
  });
});
