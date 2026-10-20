import { describe, expect, it } from "vitest";
import { getChartData, listChallengeNames } from "@/lib/chart-service";
import { getMouseStats } from "@/lib/mouse-stats-service";
import { getDashboardStats } from "@/lib/stats-service";
import type { ChartFilters } from "@/schema/filters";
import { makeChallenge, makeSensitivity } from "./factories";

const NOW = new Date("2026-10-20T12:00:00Z");
const filters = (overrides: Partial<ChartFilters> = {}): ChartFilters => ({ range: "all", compare: undefined, ...overrides });

describe("graphique (SQL brut par jour)", () => {
  it("regroupe par jour dans le fuseau de l'app, pas en UTC", async () => {
    // 21:59:59 UTC = 23:59:59 à Paris (le 20) ; 22:00:00 UTC = 00:00:00 à Paris (le 21)
    await makeChallenge({ playedAt: "2026-10-20T21:59:59Z" });
    await makeChallenge({ playedAt: "2026-10-20T22:00:00Z" });

    const { rows } = await getChartData(filters(), NOW);
    expect(rows.map((row) => row.date)).toEqual(["2026-10-20", "2026-10-21"]);
  });

  it("calcule la précision pondérée du jour (touchés cumulés / tirs cumulés), pas la moyenne des pourcentages", async () => {
    await makeChallenge({ playedAt: "2026-10-20T10:00:00Z", shotsHit: 10, totalShots: 20 });
    await makeChallenge({ playedAt: "2026-10-20T11:00:00Z", shotsHit: 90, totalShots: 400 });

    const { rows } = await getChartData(filters(), NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0].a).toMatchObject({ accuracy: 23.81, shotsHit: 100, totalShots: 420, sessions: 2 });
  });

  it("filtre par arme, catégorie et challenge", async () => {
    await makeChallenge({ weaponId: "volt", challengeName: "A", playedAt: "2026-10-18T10:00:00Z" });
    await makeChallenge({ weaponId: "r99", challengeName: "B", playedAt: "2026-10-19T10:00:00Z" });
    await makeChallenge({ weaponId: "flatline", challengeName: "A", playedAt: "2026-10-20T10:00:00Z" });

    const days = async (f: Partial<ChartFilters>) => (await getChartData(filters(f), NOW)).rows.map((row) => row.date);
    expect(await days({ weapon: "volt" })).toEqual(["2026-10-18"]);
    expect(await days({ weaponType: "SMG" })).toEqual(["2026-10-18", "2026-10-19"]);
    expect(await days({ challenge: "A" })).toEqual(["2026-10-18", "2026-10-20"]);
    expect(await days({ weaponType: "AR", challenge: "B" })).toEqual([]);
  });

  it("traite une valeur hostile comme une simple donnée (pas d'injection SQL)", async () => {
    await makeChallenge({ playedAt: "2026-10-20T10:00:00Z" });
    const hostile = "x'; DROP TABLE challenges; --";
    const { rows } = await getChartData(filters({ challenge: hostile, weaponType: "SMG" }), NOW);
    expect(rows).toEqual([]);
    expect((await getChartData(filters(), NOW)).rows).toHaveLength(1);
  });

  it("borne la période : « 1 semaine » exclut ce qui est plus vieux de 7 jours", async () => {
    await makeChallenge({ playedAt: "2026-10-13T11:59:59Z" });
    await makeChallenge({ playedAt: "2026-10-13T12:00:00Z" });
    const { rows } = await getChartData(filters({ range: "1w" }), NOW);
    expect(rows).toHaveLength(1);
  });

  it("donne une ligne par partie sur « 1 jour » et fusionne les deux armes comparées", async () => {
    await makeChallenge({ weaponId: "volt", playedAt: "2026-10-20T08:00:00Z", shotsHit: 40 });
    await makeChallenge({ weaponId: "volt", playedAt: "2026-10-20T09:00:00Z", shotsHit: 60 });
    await makeChallenge({ weaponId: "r99", playedAt: "2026-10-20T09:00:00Z", shotsHit: 70 });

    const data = await getChartData(filters({ range: "1d", weapon: "volt", compare: "r99" }), NOW);
    expect(data.granularity).toBe("session");
    expect(data.compare).toBe(true);
    expect(data.rows.map((row) => [row.accuracyA, row.accuracyB])).toEqual([[40, null], [60, 70]]);
  });

  it("liste les noms de challenges sans doublon", async () => {
    await makeChallenge({ challengeName: "B" });
    await makeChallenge({ challengeName: "A" });
    await makeChallenge({ challengeName: "A" });
    expect(await listChallengeNames()).toEqual(["A", "B"]);
  });

  it("renvoie des lignes vides sur une base vide", async () => {
    expect((await getChartData(filters(), NOW)).rows).toEqual([]);
    expect((await getChartData(filters({ range: "1d" }), NOW)).rows).toEqual([]);
  });
});

describe("stats par arme", () => {
  it("cumule par arme et calcule la tendance contre la période précédente", async () => {
    // Période précédente (1 semaine avant) : 30 % ; période courante : 50 %
    await makeChallenge({ weaponId: "volt", playedAt: "2026-10-10T12:00:00Z", shotsHit: 30, totalShots: 100 });
    await makeChallenge({ weaponId: "volt", playedAt: "2026-10-18T12:00:00Z", shotsHit: 50, totalShots: 100, criticalShots: 10, kills: 4, damage: 1000 });
    await makeChallenge({ weaponId: "volt", playedAt: "2026-10-19T12:00:00Z", shotsHit: 50, totalShots: 100, criticalShots: 10, kills: 6, damage: 2000 });

    const { weapons, kpi } = await getDashboardStats(filters({ range: "1w" }), NOW);
    expect(weapons).toHaveLength(1);
    expect(weapons[0]).toMatchObject({ slug: "volt", challenges: 2, accuracy: 50, criticalRate: 20, avgDamage: 1500, avgKills: 5, trend: 20 });
    expect(kpi).toMatchObject({ challenges: 2, accuracy: 50, playTime: 120 });
  });

  it("calcule les favorites sur tout l'historique, même quand un filtre les masque", async () => {
    for (let i = 0; i < 3; i++) await makeChallenge({ weaponId: "volt", playedAt: "2026-09-01T12:00:00Z" });
    await makeChallenge({ weaponId: "r99", playedAt: "2026-10-19T12:00:00Z" });

    // Sur « 1 jour », seule la R-99 est dans la plage ; la préférée reste la Volt (la plus jouée de tout l'historique)
    const { favorites, weapons } = await getDashboardStats(filters({ range: "1d" }), NOW);
    expect(weapons.map((w) => w.slug)).toEqual(["r99"]);
    expect(favorites.overall).toBe("volt");
    expect(favorites.byType.SMG).toBe("volt");
    expect(weapons[0].favorite).toBeNull();
  });

  it("ne désigne pas de meilleure arme sous le seuil de tirs", async () => {
    await makeChallenge({ shotsHit: 9, totalShots: 10 });
    const { kpi } = await getDashboardStats(filters(), NOW);
    expect(kpi.bestWeaponId).toBeNull();
  });
});

describe("précision par réglage de souris", () => {
  it("répartit les challenges selon le réglage actif et calcule l'écart entre périodes", async () => {
    await makeSensitivity("2026-10-10T00:00:00Z", 800, 1);
    await makeSensitivity("2026-10-15T00:00:00Z", 1600, 0.5);
    await makeChallenge({ playedAt: "2026-10-05T12:00:00Z", shotsHit: 20, totalShots: 100 });
    await makeChallenge({ playedAt: "2026-10-12T12:00:00Z", shotsHit: 40, totalShots: 100 });
    await makeChallenge({ playedAt: "2026-10-16T12:00:00Z", shotsHit: 60, totalShots: 100 });
    await makeChallenge({ playedAt: "2026-10-17T12:00:00Z", shotsHit: 60, totalShots: 100 });

    const { rows, settingsCount } = await getMouseStats(filters(), NOW);
    expect(settingsCount).toBe(2);
    expect(rows.map((row) => [row.mouse?.dpi ?? null, row.challenges, row.accuracy, row.delta])).toEqual([
      [null, 1, 20, null],
      [800, 1, 40, 20],
      [1600, 2, 60, 20],
    ]);
  });

  it("omet « avant le premier réglage » s'il est vide et les périodes hors plage", async () => {
    await makeSensitivity("2026-09-01T00:00:00Z", 800, 1);
    await makeSensitivity("2026-10-19T00:00:00Z", 1600, 0.5);
    await makeChallenge({ playedAt: "2026-10-19T12:00:00Z" });

    const { rows } = await getMouseStats(filters({ range: "1d" }), NOW);
    expect(rows.map((row) => row.mouse?.dpi)).toEqual([1600]);
  });

  it("ne renvoie rien sans réglage", async () => {
    await makeChallenge();
    expect(await getMouseStats(filters(), NOW)).toEqual({ settingsCount: 0, rows: [] });
  });
});
