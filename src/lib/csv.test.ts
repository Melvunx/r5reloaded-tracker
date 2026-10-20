import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("découpe les cellules et les lignes", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      { line: 1, cells: ["a", "b", "c"] },
      { line: 2, cells: ["1", "2", "3"] },
    ]);
  });

  it("gère les fins de ligne \\r\\n et une fin de fichier avec saut de ligne", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      { line: 1, cells: ["a", "b"] },
      { line: 2, cells: ["1", "2"] },
    ]);
  });

  it("ignore les lignes vides mais garde les vrais numéros de ligne", () => {
    expect(parseCsv("a\n\n\nb\r\n\r\nc")).toEqual([
      { line: 1, cells: ["a"] },
      { line: 4, cells: ["b"] },
      { line: 6, cells: ["c"] },
    ]);
  });

  it("garde les cellules vides", () => {
    expect(parseCsv("a,,c\n,,")).toEqual([
      { line: 1, cells: ["a", "", "c"] },
      { line: 2, cells: ["", "", ""] },
    ]);
  });

  it("gère les guillemets : virgule, guillemet échappé et retour à la ligne dans un champ", () => {
    expect(parseCsv('"a,b","il a dit ""oui""","x\ny"\nsuite,1,2')).toEqual([
      { line: 1, cells: ["a,b", 'il a dit "oui"', "x\ny"] },
      { line: 3, cells: ["suite", "1", "2"] },
    ]);
  });

  it('accepte un champ entre guillemets après un espace (`a, "b"`)', () => {
    expect(parseCsv('a, "b,c", d')).toEqual([
      { line: 1, cells: ["a", "b,c", " d"] },
    ]);
  });

  it("ne trim pas les cellules", () => {
    expect(parseCsv("a, b ")).toEqual([{ line: 1, cells: ["a", " b "] }]);
  });

  it("renvoie un tableau vide pour un texte vide", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("\r\n\r\n")).toEqual([]);
  });
});
