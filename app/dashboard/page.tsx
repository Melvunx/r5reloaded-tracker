import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccuracyChart } from "@/components/dashboard/accuracy-chart";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { WeaponStatsTable } from "@/components/dashboard/weapon-stats-table";
import { ChartFilters } from "@/components/dashboard/chart-filters";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getChartData, listChallengeNames } from "@/lib/chart-service";
import { getDashboardStats } from "@/lib/stats-service";
import { parseChartFilters } from "@/schema/filters";

export const metadata: Metadata = { title: "Tableau de bord" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function DashboardContent({ searchParams }: Props) {
  // La période dépend de l'heure courante : on sort explicitement du pré-rendu avant d'appeler `new Date()`
  await connection();
  const filters = parseChartFilters(await searchParams);
  // Même instant pour le graphique et les stats : leurs périodes (et la tendance) restent alignées
  const now = new Date();
  const [chart, stats, challengeNames] = await Promise.all([
    getChartData(filters, now),
    getDashboardStats(filters, now),
    listChallengeNames(),
  ]);

  return (
    <>
      {challengeNames.length > 0 && <ChartFilters filters={filters} challengeNames={challengeNames} />}
      {chart.points.length > 0 ? (
        <>
          <KpiCards kpi={stats.kpi} />
          <AccuracyChart {...chart} />
          <WeaponStatsTable weapons={stats.weapons} hasTrend={filters.range !== "all"} />
        </>
      ) : challengeNames.length === 0 ? (
        <EmptyState
          title="Aucun challenge pour le moment"
          description="Importe un export R5Reloaded ou saisis une partie à la main pour voir ta progression."
        >
          <Link href="/import" className={buttonVariants()}>
            Importer des résultats
          </Link>
          <Link href="/manual-entry" className={buttonVariants({ variant: "outline" })}>
            Saisir une partie
          </Link>
        </EmptyState>
      ) : (
        <EmptyState
          title="Aucun challenge ne correspond à ces filtres"
          description="Élargis la période ou retire un filtre."
        >
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Réinitialiser les filtres
          </Link>
        </EmptyState>
      )}
    </>
  );
}

export default function DashboardPage({ searchParams }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
