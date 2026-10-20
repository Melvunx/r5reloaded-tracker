import { CardSkeleton } from "@/components/card-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Même disposition que le dashboard chargé (filtres, KPI, graphique, tableau) pour éviter les sauts de mise en page. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Chargement du tableau de bord">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-80 max-w-full" />
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-52" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Card key={index}>
            <CardHeader className="gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
      <CardSkeleton rows={5} />
    </div>
  );
}
