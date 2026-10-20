import { APP_TIME_ZONE } from "@/config/time.config";
import { prisma } from "@/lib/prisma";
import { rangeStart, weightedAccuracy } from "@/lib/stats";
import type { ChartFilters } from "@/schema/filters";
import { Prisma } from "@app/generated/prisma/client";

export type ChartPoint = {
  /** `YYYY-MM-DD` (jour, fuseau de l'app) en mode « day », instant ISO en mode « session ». */
  date: string;
  accuracy: number;
  shotsHit: number;
  totalShots: number;
  sessions: number;
  weapons: string[];
};

export type ChartData = {
  granularity: "session" | "day";
  points: ChartPoint[];
};

function buildWhere(
  filters: ChartFilters,
  since: Date | null,
): Prisma.ChallengeWhereInput {
  return {
    ...(filters.weapon && { weaponId: filters.weapon }),
    ...(filters.weaponType && { weapon: { type: filters.weaponType } }),
    ...(filters.challenge && { challengeName: filters.challenge }),
    ...(since && { playedAt: { gte: since } }),
  };
}

/** Une partie = un point (période d'un jour). */
async function getSessionPoints(
  filters: ChartFilters,
  since: Date | null,
): Promise<ChartPoint[]> {
  const rows = await prisma.challenge.findMany({
    where: buildWhere(filters, since),
    orderBy: { playedAt: "asc" },
    select: {
      playedAt: true,
      shotsHit: true,
      totalShots: true,
      weapon: { select: { name: true } },
    },
  });
  return rows.map((row) => ({
    date: row.playedAt.toISOString(),
    accuracy: weightedAccuracy(row.shotsHit, row.totalShots),
    shotsHit: row.shotsHit,
    totalShots: row.totalShots,
    sessions: 1,
    weapons: [row.weapon.name],
  }));
}

type DayRow = {
  day: string;
  shots_hit: number;
  total_shots: number;
  sessions: number;
  weapons: string[];
};

/** Agrégat par jour fait en base : `played_at` est stocké en UTC, on le ramène au fuseau de l'app avant de tronquer. */
async function getDayPoints(
  filters: ChartFilters,
  since: Date | null,
): Promise<ChartPoint[]> {
  const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (since)
    conditions.push(
      Prisma.sql`c.played_at >= (${since.toISOString()}::timestamptz AT TIME ZONE 'UTC')`,
    );
  if (filters.weapon)
    conditions.push(Prisma.sql`c.weapon_id = ${filters.weapon}`);
  if (filters.weaponType)
    conditions.push(Prisma.sql`w.type = ${filters.weaponType}::"WeaponType"`);
  if (filters.challenge)
    conditions.push(Prisma.sql`c.challenge_name = ${filters.challenge}`);

  const rows = await prisma.$queryRaw<DayRow[]>`
    SELECT
      to_char(date_trunc('day', c.played_at AT TIME ZONE 'UTC' AT TIME ZONE ${APP_TIME_ZONE}), 'YYYY-MM-DD') AS day,
      SUM(c.shots_hit)::int AS shots_hit,
      SUM(c.total_shots)::int AS total_shots,
      COUNT(*)::int AS sessions,
      array_agg(DISTINCT w.name ORDER BY w.name) AS weapons
    FROM challenges c
    JOIN weapons w ON w.id = c.weapon_id
    WHERE ${Prisma.join(conditions, " AND ")}
    GROUP BY day
    ORDER BY day
  `;
  return rows.map((row) => ({
    date: row.day,
    accuracy: weightedAccuracy(row.shots_hit, row.total_shots),
    shotsHit: row.shots_hit,
    totalShots: row.total_shots,
    sessions: row.sessions,
    weapons: row.weapons,
  }));
}

/** Données du graphique : une partie par point sur un jour, une précision pondérée par jour au-delà. */
export async function getChartData(
  filters: ChartFilters,
  now = new Date(),
): Promise<ChartData> {
  const since = rangeStart(filters.range, now);
  if (filters.range === "1d")
    return {
      granularity: "session",
      points: await getSessionPoints(filters, since),
    };
  return { granularity: "day", points: await getDayPoints(filters, since) };
}

/** Noms de challenges déjà joués, pour le filtre. */
export async function listChallengeNames() {
  const rows = await prisma.challenge.groupBy({
    by: ["challengeName"],
    orderBy: { challengeName: "asc" },
  });
  return rows.map((row) => row.challengeName);
}
