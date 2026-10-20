import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccuracyChart } from "@/components/dashboard/accuracy-chart";
import { ChartFilters } from "@/components/dashboard/chart-filters";
import { buttonVariants } from "@/components/ui/button";
import { getChartData, listChallengeNames } from "@/lib/chart-service";
import { parseChartFilters } from "@/schema/filters";

export const metadata: Metadata = { title: "Tableau de bord" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function DashboardContent({ searchParams }: Props) {
  // La période dépend de l'heure courante : on sort explicitement du pré-rendu avant d'appeler `new Date()`
  await connection();
  const filters = parseChartFilters(await searchParams);
  const [chart, challengeNames] = await Promise.all([getChartData(filters), listChallengeNames()]);

  return (
    <>
      <ChartFilters filters={filters} challengeNames={challengeNames} />
      {chart.points.length > 0 ? (
        <AccuracyChart {...chart} />
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
          <p className="text-muted-foreground">Aucun challenge ne correspond à ces filtres.</p>
          <Link href="/import" className={buttonVariants({ variant: "outline" })}>
            Importer des résultats
          </Link>
        </div>
      )}
    </>
  );
}

export default function DashboardPage({ searchParams }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement du graphique…</p>}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
