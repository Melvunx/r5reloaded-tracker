import { buildWhere } from "@/lib/chart-service";
import { buildPeriods, describeSetting, type MouseInfo } from "@/lib/mouse-link";
import { prisma } from "@/lib/prisma";
import { listSensitivities } from "@/lib/sensitivity-service";
import { rangeStart, weightedAccuracy } from "@/lib/stats";
import type { ChartFilters } from "@/schema/filters";

export type MouseStatRow = {
  /** null = challenges joués avant le premier réglage saisi. */
  settingId: string | null;
  mouse: MouseInfo | null;
  from: Date | null;
  to: Date | null;
  challenges: number;
  accuracy: number | null;
  /** Écart de précision (en points) avec la période précédente qui contient des challenges. */
  delta: number | null;
};

/**
 * Précision pondérée pour chaque période de réglage souris, avec les mêmes filtres que le graphique. Chaque période
 * est bornée par la plage choisie (1 semaine, etc.) ; celles qui ne la touchent pas sont omises.
 */
export async function getMouseStats(filters: ChartFilters, now = new Date()) {
  const settings = await listSensitivities();
  const since = rangeStart(filters.range, now);

  const rows = await Promise.all(
    buildPeriods(settings).map(async ({ setting, from, to }): Promise<MouseStatRow | null> => {
      const gte = from && since ? new Date(Math.max(from.getTime(), since.getTime())) : (from ?? since);
      if (gte && to && gte >= to) return null;

      const period = { ...(gte && { gte }), ...(to && { lt: to }) };
      const total = await prisma.challenge.aggregate({
        where: buildWhere(filters, period),
        _count: { _all: true },
        _sum: { shotsHit: true, totalShots: true },
      });
      const totalShots = total._sum.totalShots ?? 0;
      return {
        settingId: setting?.id ?? null,
        mouse: setting ? describeSetting(setting) : null,
        from,
        to,
        challenges: total._count._all,
        accuracy: total._count._all > 0 ? weightedAccuracy(total._sum.shotsHit ?? 0, totalShots) : null,
        delta: null,
      };
    }),
  );

  // « Avant le premier réglage » n'a d'intérêt que s'il contient des challenges
  const kept = rows.filter((row): row is MouseStatRow => row !== null && (row.settingId !== null || row.challenges > 0));

  let previous: number | null = null;
  const withDelta = kept.map((row) => {
    const delta = row.accuracy !== null && previous !== null ? Math.round((row.accuracy - previous) * 100) / 100 : null;
    if (row.accuracy !== null) previous = row.accuracy;
    return { ...row, delta };
  });

  return { settingsCount: settings.length, rows: withDelta };
}
