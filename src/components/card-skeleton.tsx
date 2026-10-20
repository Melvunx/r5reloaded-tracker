import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Carte de chargement : titre, description et `rows` lignes. Sert de `fallback` aux historiques et formulaires. */
export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card aria-busy="true" aria-label="Chargement">
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
