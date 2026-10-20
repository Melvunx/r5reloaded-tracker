import { describe, expect, it } from "vitest";
import { rangeStart, weightedAccuracy } from "./stats";

describe("weightedAccuracy", () => {
  it("pondère par le nombre de tirs plutôt que de moyenner les pourcentages", () => {
    // 10/20 (50 %) + 90/400 (22,5 %) : la moyenne des % ferait 36,25 %
    expect(weightedAccuracy(10 + 90, 20 + 400)).toBe(23.81);
  });

  it("renvoie 0 sans tir", () => {
    expect(weightedAccuracy(0, 0)).toBe(0);
  });
});

describe("rangeStart", () => {
  const now = new Date("2026-10-20T12:00:00Z");

  it("recule du bon nombre de jours", () => {
    expect(rangeStart("1d", now)).toEqual(new Date("2026-10-19T12:00:00Z"));
    expect(rangeStart("1w", now)).toEqual(new Date("2026-10-13T12:00:00Z"));
    expect(rangeStart("1m", now)).toEqual(new Date("2026-09-20T12:00:00Z"));
  });

  it("renvoie null pour « tout »", () => {
    expect(rangeStart("all", now)).toBeNull();
  });
});
