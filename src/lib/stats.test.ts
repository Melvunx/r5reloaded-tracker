import { describe, expect, it } from "vitest";
import {
  buildKpi,
  buildWeaponStats,
  formatPlayTime,
  previousPeriod,
  rangeStart,
  weightedAccuracy,
  type WeaponTotals,
} from "./stats";

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

describe("previousPeriod", () => {
  it("couvre la période de même durée juste avant", () => {
    expect(previousPeriod("1w", new Date("2026-10-20T12:00:00Z"))).toEqual({
      from: new Date("2026-10-06T12:00:00Z"),
      to: new Date("2026-10-13T12:00:00Z"),
    });
  });

  it("renvoie null sur « tout »", () => {
    expect(previousPeriod("all", new Date())).toBeNull();
  });
});

const totals = (overrides: Partial<WeaponTotals>): WeaponTotals => ({
  weaponId: "volt",
  challenges: 2,
  shotsHit: 200,
  totalShots: 400,
  criticalShots: 20,
  damage: 5000,
  kills: 25,
  roundtime: 120,
  bestAccuracy: 55,
  ...overrides,
});

describe("buildWeaponStats", () => {
  it("calcule précision, % critiques et moyennes par challenge", () => {
    const [row] = buildWeaponStats([totals({})], []);
    expect(row).toMatchObject({ accuracy: 50, criticalRate: 10, avgDamage: 2500, avgKills: 12.5, trend: null });
  });

  it("donne la tendance en points face à la période précédente", () => {
    const [row] = buildWeaponStats([totals({})], [totals({ shotsHit: 90, totalShots: 300 })]);
    expect(row.trend).toBe(20);
  });
});

describe("buildKpi", () => {
  it("cumule les armes et pondère la précision globale", () => {
    const kpi = buildKpi([totals({}), totals({ weaponId: "r99", shotsHit: 100, totalShots: 400, roundtime: 60 })]);
    expect(kpi).toMatchObject({ accuracy: 37.5, challenges: 4, playTime: 180 });
  });

  it("ignore les armes trop peu jouées pour la meilleure arme", () => {
    const kpi = buildKpi([totals({}), totals({ weaponId: "r99", shotsHit: 9, totalShots: 10 })]);
    expect(kpi.bestWeaponId).toBe("volt");
    expect(buildKpi([totals({ totalShots: 10, shotsHit: 9 })]).bestWeaponId).toBeNull();
  });
});

describe("arme préférée", () => {
  it("est l'arme avec le plus de challenges, sans seuil de tirs", () => {
    const kpi = buildKpi([totals({ challenges: 2 }), totals({ weaponId: "r99", challenges: 5, shotsHit: 1, totalShots: 5 })]);
    expect(kpi.favoriteWeaponId).toBe("r99");
  });

  it("départage les égalités par le nombre de tirs", () => {
    const kpi = buildKpi([totals({ weaponId: "volt", totalShots: 400 }), totals({ weaponId: "r99", totalShots: 900 })]);
    expect(kpi.favoriteWeaponId).toBe("r99");
  });

  it("est null sans données", () => {
    expect(buildKpi([]).favoriteWeaponId).toBeNull();
  });
});

describe("formatPlayTime", () => {
  it("choisit l'unité lisible", () => {
    expect(formatPlayTime(45)).toBe("45 s");
    expect(formatPlayTime(300)).toBe("5 min");
    expect(formatPlayTime(3725)).toBe("1 h 02");
  });
});
