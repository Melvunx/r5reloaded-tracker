import { describe, expect, it } from "vitest";
import { getExportDate } from "./export-date";

describe("getExportDate", () => {
  it("lit le timestamp Unix dans le nom du fichier", () => {
    expect(getExportDate("aimtrainer_results_1792494390.txt")?.toISOString()).toBe("2026-10-20T11:06:30.000Z");
  });

  it("renvoie undefined si le nom ne contient pas de timestamp", () => {
    expect(getExportDate("export.txt")).toBeUndefined();
    expect(getExportDate("mes_resultats.txt")).toBeUndefined();
  });
});
