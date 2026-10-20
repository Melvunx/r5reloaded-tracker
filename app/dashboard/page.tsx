import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { TransitionLink } from "@/components/motion/transition-link";
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
    <Stagger className="flex flex-col gap-6">
      {challengeNames.length > 0 && (
        <StaggerItem>
          <ChartFilters filters={filters} challengeNames={challengeNames} />
        </StaggerItem>
      )}
      {chart.points.length > 0 ? (
        <>
          <StaggerItem>
            <KpiCards kpi={stats.kpi} />
          </StaggerItem>
          <StaggerItem>
            <AccuracyChart {...chart} />
          </StaggerItem>
          <StaggerItem>
            <WeaponStatsTable weapons={stats.weapons} hasTrend={filters.range !== "all"} />
          </StaggerItem>
        </>
      ) : challengeNames.length === 0 ? (
        <EmptyState
          title="Aucun challenge pour le moment"
          description="Importe un export R5Reloaded ou saisis une partie à la main pour voir ta progression."
        >
          <TransitionLink href="/import" className={buttonVariants()}>
            Importer des résultats
          </TransitionLink>
          <TransitionLink href="/manual-entry" className={buttonVariants({ variant: "outline" })}>
            Saisir une partie
          </TransitionLink>
        </EmptyState>
      ) : (
        <EmptyState
          title="Aucun challenge ne correspond à ces filtres"
          description="Élargis la période ou retire un filtre."
        >
          <TransitionLink href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Réinitialiser les filtres
          </TransitionLink>
        </EmptyState>
      )}
    </Stagger>
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
