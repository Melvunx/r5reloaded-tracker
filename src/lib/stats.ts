import type { ChartFilters } from "@/schema/filters";

const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_DAYS = { "1d": 1, "1w": 7, "1m": 30 } as const;

/** Début de la période (null = depuis toujours). */
export function rangeStart(range: ChartFilters["range"], now: Date): Date | null {
  if (range === "all") return null;
  return new Date(now.getTime() - RANGE_DAYS[range] * DAY_MS);
}

/**
 * Précision pondérée en % : SUM(touchés) / SUM(tirs), arrondie à 2 décimales.
 * Une moyenne de pourcentages donnerait autant de poids à une partie de 20 tirs qu'à une de 400.
 */
export function weightedAccuracy(shotsHit: number, totalShots: number) {
  if (totalShots <= 0) return 0;
  return Math.round((shotsHit / totalShots) * 10_000) / 100;
}
