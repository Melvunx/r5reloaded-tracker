import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TransitionLink } from "@/components/motion/transition-link";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { getMouseStats } from "@/lib/mouse-stats-service";
import { cn } from "@/lib/utils";

type Stats = Awaited<ReturnType<typeof getMouseStats>>;

const day = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

function period(from: Date | null, to: Date | null) {
  if (!from && to) return `Avant le ${day.format(to)}`;
  return `${from ? day.format(from) : "…"} → ${to ? day.format(to) : "aujourd'hui"}`;
}

/** Précision pour chaque réglage de souris, du plus récent au plus ancien. */
export function MouseStatsCard({ stats }: { stats: Stats }) {
  if (stats.settingsCount === 0) {
    return (
      <EmptyState
        title="Aucun réglage de souris enregistré"
        description="Enregistre ton DPI et ta sensibilité pour voir comment ta précision évolue d'un réglage à l'autre."
      >
        <TransitionLink href="/mouse-settings" className={buttonVariants({ variant: "outline" })}>
          Ajouter un réglage
        </TransitionLink>
      </EmptyState>
    );
  }

  const rows = [...stats.rows].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Précision par réglage de souris</CardTitle>
        <CardDescription>
          Mêmes filtres que le graphique. Attention : une meilleure précision après un changement ne prouve pas que le
          réglage en est la cause, tu progresses aussi en t&apos;entraînant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Période</TableHead>
              <TableHead className="text-right">Réglage</TableHead>
              <TableHead className="text-right">cm/360°</TableHead>
              <TableHead className="text-right">eDPI</TableHead>
              <TableHead className="text-right">Challenges</TableHead>
              <TableHead className="text-right">Précision</TableHead>
              <TableHead className="text-right">Écart</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.settingId ?? "before"}>
                <TableCell>
                  {period(row.from, row.to)}
                  {row.settingId !== null && row.to === null && <Badge className="ml-2">Actuel</Badge>}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {row.mouse ? `${row.mouse.dpi} × ${row.mouse.sensitivity}` : "—"}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">{row.mouse ? row.mouse.cmPer360.toFixed(1) : "—"}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{row.mouse ? Math.round(row.mouse.edpi) : "—"}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{row.challenges}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {row.accuracy === null ? "—" : `${row.accuracy.toFixed(2)} %`}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono tabular-nums",
                    row.delta === null && "text-muted-foreground",
                    row.delta !== null && row.delta > 0 && "text-green-600 dark:text-green-400",
                    row.delta !== null && row.delta < 0 && "text-red-600 dark:text-red-400",
                  )}
                >
                  {row.delta === null ? "—" : `${row.delta > 0 ? "+" : ""}${row.delta.toFixed(2)} pts`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
