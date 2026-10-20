import type { ChartPoint } from "@/lib/chart-service";

/** Valeurs d'une série (une arme) à un point du graphique. */
export type SeriesStats = Omit<ChartPoint, "date">;

/**
 * Ligne du graphique : un instant (ou un jour) et, pour chaque série, sa précision. `accuracyA` / `accuracyB`
 * sont à plat pour Recharts (`dataKey`) ; `a` / `b` gardent le détail pour l'infobulle.
 */
export type ChartRow = {
  date: string;
  accuracyA: number | null;
  accuracyB: number | null;
  a: SeriesStats | null;
  b: SeriesStats | null;
};

const toStats = ({ accuracy, shotsHit, totalShots, sessions, weapons }: ChartPoint): SeriesStats => ({
  accuracy,
  shotsHit,
  totalShots,
  sessions,
  weapons,
});

function groupByDate(points: ChartPoint[]) {
  const groups = new Map<string, ChartPoint[]>();
  for (const point of points) groups.set(point.date, [...(groups.get(point.date) ?? []), point]);
  return groups;
}

/**
 * Fusionne la série A et la série B sur un même axe. Plusieurs points peuvent partager une date (toutes les parties
 * d'un même import ont la même `playedAt`) : à date égale, on les apparie dans l'ordre plutôt que de les écraser.
 */
export function mergeSeries(a: ChartPoint[], b: ChartPoint[]): ChartRow[] {
  const groupsA = groupByDate(a);
  const groupsB = groupByDate(b);
  const dates = [...new Set([...groupsA.keys(), ...groupsB.keys()])].sort();

  return dates.flatMap((date) => {
    const left = groupsA.get(date) ?? [];
    const right = groupsB.get(date) ?? [];
    return Array.from({ length: Math.max(left.length, right.length) }, (_, index): ChartRow => {
      const pointA = left[index];
      const pointB = right[index];
      return {
        date,
        accuracyA: pointA?.accuracy ?? null,
        accuracyB: pointB?.accuracy ?? null,
        a: pointA ? toStats(pointA) : null,
        b: pointB ? toStats(pointB) : null,
      };
    });
  });
}
