import { getWeaponBySlug } from "@/config/apex-weapons.config";
import { buildWhere } from "@/lib/chart-service";
import { prisma } from "@/lib/prisma";
import {
  buildKpi,
  buildWeaponStats,
  pickFavorites,
  previousPeriod,
  rangeStart,
  type Favorites,
  type Kpi,
  type WeaponStatRow,
  type WeaponTotals,
} from "@/lib/stats";
import type { ChartFilters } from "@/schema/filters";

/** Cumuls par arme calculés en base (`groupBy`) sur une période. */
async function getWeaponTotals(filters: ChartFilters, period: { gte?: Date; lt?: Date }): Promise<WeaponTotals[]> {
  const groups = await prisma.challenge.groupBy({
    by: ["weaponId"],
    where: buildWhere(filters, period),
    _count: { _all: true },
    _sum: { shotsHit: true, totalShots: true, criticalShots: true, damage: true, kills: true, roundtime: true },
    _max: { accuracy: true },
  });
  return groups.map((group) => ({
    weaponId: group.weaponId,
    challenges: group._count._all,
    shotsHit: group._sum.shotsHit ?? 0,
    totalShots: group._sum.totalShots ?? 0,
    criticalShots: group._sum.criticalShots ?? 0,
    damage: group._sum.damage ?? 0,
    kills: group._sum.kills ?? 0,
    roundtime: group._sum.roundtime ?? 0,
    bestAccuracy: group._max.accuracy ?? 0,
  }));
}

export type WeaponStat = WeaponStatRow & {
  name: string;
  slug: string;
  type: NonNullable<ReturnType<typeof getWeaponBySlug>>["type"];
  /** « overall » = arme préférée de tout l'historique, « category » = favorite de sa catégorie (pour les effets visuels). */
  favorite: "overall" | "category" | null;
};

export type DashboardStats = {
  kpi: Kpi & { bestWeaponName: string | null; favoriteWeaponName: string | null };
  weapons: WeaponStat[];
};

function favoriteKind(favorites: Favorites, weaponId: string, type: WeaponStat["type"]): WeaponStat["favorite"] {
  if (favorites.overall === weaponId) return "overall";
  return favorites.byType[type] === weaponId ? "category" : null;
}

const weaponName = (slug: string | null) => (slug ? (getWeaponBySlug(slug)?.name ?? null) : null);

/** KPI et statistiques par arme, avec les mêmes filtres que le graphique. */
export async function getDashboardStats(filters: ChartFilters, now = new Date()): Promise<DashboardStats> {
  const since = rangeStart(filters.range, now);
  const before = previousPeriod(filters.range, now);
  const [current, previous] = await Promise.all([
    getWeaponTotals(filters, since ? { gte: since } : {}),
    before ? getWeaponTotals(filters, { gte: before.from, lt: before.to }) : Promise.resolve([]),
  ]);

  // Les favorites se calculent sur tout l'historique : elles ne bougent pas quand on change de filtre
  const allTime = await getWeaponTotals({ range: "all" }, {});
  const favorites = pickFavorites(allTime, (id) => getWeaponBySlug(id)?.type);

  const kpi = buildKpi(current);
  const weapons = buildWeaponStats(current, previous).flatMap((row) => {
    const weapon = getWeaponBySlug(row.weaponId);
    // Une arme retirée de la config mais encore en base n'a ni nom ni image : on l'écarte plutôt que d'afficher un id brut
    return weapon
      ? [{ ...row, name: weapon.name, slug: weapon.slug, type: weapon.type, favorite: favoriteKind(favorites, row.weaponId, weapon.type) }]
      : [];
  });

  return {
    kpi: { ...kpi, bestWeaponName: weaponName(kpi.bestWeaponId), favoriteWeaponName: weaponName(favorites.overall) },
    weapons,
  };
}
