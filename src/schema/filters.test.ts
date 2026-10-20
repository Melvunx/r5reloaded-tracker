import { describe, expect, it } from "vitest";
import { ChartFiltersSchema, parseChartFilters } from "./filters";

describe("ChartFiltersSchema", () => {
  it("applique 1w par défaut", () => {
    expect(ChartFiltersSchema.parse({})).toEqual({ range: "1w" });
  });

  it("garde des filtres valides", () => {
    expect(
      parseChartFilters({ weapon: "r99", weaponType: "SMG", range: "1m", challenge: "STRAFING DUMMY" }),
    ).toEqual({ weapon: "r99", weaponType: "SMG", range: "1m", challenge: "STRAFING DUMMY" });
  });

  it("retombe sur le défaut pour une valeur invalide, sans planter", () => {
    expect(
      parseChartFilters({ weapon: "bocek", weaponType: "SPOON", range: "2y", challenge: "" }),
    ).toEqual({ range: "1w" });
  });

  it("garde la comparaison seulement entre deux armes différentes", () => {
    expect(parseChartFilters({ weapon: "r99", compare: "volt" }).compare).toBe("volt");
    expect(parseChartFilters({ weapon: "r99", compare: "r99" }).compare).toBeUndefined();
    expect(parseChartFilters({ compare: "volt" }).compare).toBeUndefined();
    expect(parseChartFilters({ weapon: "r99", compare: "bocek" }).compare).toBeUndefined();
  });

  it("prend le premier élément d'un paramètre répété", () => {
    expect(parseChartFilters({ range: ["1d", "all"], weapon: ["r99", "volt"] })).toEqual({
      range: "1d",
      weapon: "r99",
    });
  });
});
