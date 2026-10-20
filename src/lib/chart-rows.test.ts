import { describe, expect, it } from "vitest";
import { mergeSeries } from "./chart-rows";
import type { ChartPoint } from "./chart-service";

const point = (date: string, accuracy: number, weapon = "Volt"): ChartPoint => ({
  date,
  accuracy,
  shotsHit: accuracy,
  totalShots: 100,
  sessions: 1,
  weapons: [weapon],
});

describe("mergeSeries", () => {
  it("aligne les deux séries sur les dates communes et laisse null ailleurs", () => {
    const rows = mergeSeries(
      [point("2026-10-18", 40), point("2026-10-19", 42)],
      [point("2026-10-19", 50, "R-99"), point("2026-10-20", 52, "R-99")],
    );
    expect(rows.map(({ date, accuracyA, accuracyB }) => [date, accuracyA, accuracyB])).toEqual([
      ["2026-10-18", 40, null],
      ["2026-10-19", 42, 50],
      ["2026-10-20", null, 52],
    ]);
  });

  it("n'écrase pas les points qui partagent une date (parties d'un même import)", () => {
    const rows = mergeSeries(
      [point("2026-10-20T11:06:30.000Z", 46), point("2026-10-20T11:06:30.000Z", 44), point("2026-10-20T11:06:30.000Z", 42)],
      [point("2026-10-20T11:06:30.000Z", 50, "R-99")],
    );
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.accuracyB)).toEqual([50, null, null]);
    expect(rows[0].b?.weapons).toEqual(["R-99"]);
  });

  it("sans seconde série, renvoie simplement la première", () => {
    const rows = mergeSeries([point("2026-10-18", 40)], []);
    expect(rows).toEqual([{ date: "2026-10-18", accuracyA: 40, accuracyB: null, a: expect.any(Object), b: null }]);
  });

  it("trie par date", () => {
    const rows = mergeSeries([point("2026-10-20", 1)], [point("2026-10-18", 2)]);
    expect(rows.map((row) => row.date)).toEqual(["2026-10-18", "2026-10-20"]);
  });
});
