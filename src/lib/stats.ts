import type { WeaponType } from "@/config/apex-weapons.config";
import type { ChartFilters } from "@/schema/filters";

const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_DAYS = { "1d": 1, "1w": 7, "1m": 30 } as const;

/** Période précédente de même durée (pour la tendance) ; null sur « tout », qui n'a pas de « avant ». */
export function previousPeriod(range: ChartFilters["range"], now: Date): { from: Date; to: Date } | null {
  const to = rangeStart(range, now);
  if (!to || range === "all") return null;
  return { from: new Date(to.getTime() - RANGE_DAYS[range] * DAY_MS), to };
}

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

/** Cumuls d'une arme sur une période (somme des champs de ses challenges). */
export type WeaponTotals = {
  weaponId: string;
  challenges: number;
  shotsHit: number;
  totalShots: number;
  criticalShots: number;
  damage: number;
  kills: number;
  roundtime: number;
  bestAccuracy: number;
};

export type WeaponStatRow = {
  weaponId: string;
  challenges: number;
  accuracy: number;
  /** Tirs critiques / tirs touchés, en %. */
  criticalRate: number;
  avgDamage: number;
  avgKills: number;
  bestAccuracy: number;
  /** Écart de précision (en points) avec la période précédente ; null sans données avant. */
  trend: number | null;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Statistiques par arme ; la tendance compare la précision pondérée à celle de la période précédente. */
export function buildWeaponStats(current: WeaponTotals[], previous: WeaponTotals[]): WeaponStatRow[] {
  const previousByWeapon = new Map(previous.map((totals) => [totals.weaponId, totals]));
  return current.map((totals) => {
    const accuracy = weightedAccuracy(totals.shotsHit, totals.totalShots);
    const before = previousByWeapon.get(totals.weaponId);
    return {
      weaponId: totals.weaponId,
      challenges: totals.challenges,
      accuracy,
      criticalRate: weightedAccuracy(totals.criticalShots, totals.shotsHit),
      avgDamage: Math.round(totals.damage / totals.challenges),
      avgKills: round1(totals.kills / totals.challenges),
      bestAccuracy: totals.bestAccuracy,
      trend:
        before && before.totalShots > 0
          ? Math.round((accuracy - weightedAccuracy(before.shotsHit, before.totalShots)) * 100) / 100
          : null,
    };
  });
}

/** En dessous de ce nombre de tirs, une précision n'est pas assez fiable pour désigner « la meilleure arme ». */
export const BEST_WEAPON_MIN_SHOTS = 100;

export type Kpi = {
  accuracy: number;
  challenges: number;
  /** Temps de jeu cumulé, en secondes. */
  playTime: number;
  bestWeaponId: string | null;
};

export function buildKpi(totals: WeaponTotals[]): Kpi {
  const sum = (pick: (t: WeaponTotals) => number) => totals.reduce((acc, t) => acc + pick(t), 0);
  const best = totals
    .filter((t) => t.totalShots >= BEST_WEAPON_MIN_SHOTS)
    .map((t) => ({ weaponId: t.weaponId, accuracy: weightedAccuracy(t.shotsHit, t.totalShots) }))
    .sort((a, b) => b.accuracy - a.accuracy)[0];
  return {
    accuracy: weightedAccuracy(sum((t) => t.shotsHit), sum((t) => t.totalShots)),
    challenges: sum((t) => t.challenges),
    playTime: sum((t) => t.roundtime),
    bestWeaponId: best?.weaponId ?? null,
  };
}

/** 3725 s → « 1 h 02 », 300 s → « 5 min », 45 s → « 45 s ». */
export function formatPlayTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return `${seconds} s`;
  const hours = Math.floor(minutes / 60);
  return hours < 1 ? `${minutes} min` : `${hours} h ${String(minutes % 60).padStart(2, "0")}`;
}

export type Favorites = { overall: string | null; byType: Partial<Record<WeaponType, string>> };

/**
 * Arme préférée = la plus jouée (nombre de challenges), à égalité celle avec le plus de tirs.
 * Une par catégorie en plus de la meilleure toutes catégories. Les armes de type inconnu sont ignorées par catégorie.
 */
export function pickFavorites(
  totals: Pick<WeaponTotals, "weaponId" | "challenges" | "totalShots">[],
  typeOf: (weaponId: string) => WeaponType | undefined,
): Favorites {
  const mostPlayed = (a: (typeof totals)[number], b: (typeof totals)[number]) =>
    b.challenges - a.challenges || b.totalShots - a.totalShots;

  const byType: Favorites["byType"] = {};
  for (const entry of [...totals].sort(mostPlayed)) {
    const type = typeOf(entry.weaponId);
    if (type && !byType[type]) byType[type] = entry.weaponId;
  }
  return { overall: [...totals].sort(mostPlayed)[0]?.weaponId ?? null, byType };
}
