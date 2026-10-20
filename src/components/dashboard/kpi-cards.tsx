import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPlayTime } from "@/lib/stats";
import type { DashboardStats } from "@/lib/stats-service";

export function KpiCards({ kpi }: { kpi: DashboardStats["kpi"] }) {
  const items = [
    { label: "Précision globale", value: `${kpi.accuracy.toFixed(2)} %`, hint: "Touchés / tirs totaux" },
    { label: "Challenges joués", value: String(kpi.challenges), hint: "Sur la période" },
    { label: "Temps de jeu", value: formatPlayTime(kpi.playTime), hint: "Durée cumulée des challenges" },
    {
      label: "Meilleure arme",
      value: kpi.bestWeaponName ?? "—",
      hint: kpi.bestWeaponName ? "Meilleure précision (100 tirs min.)" : "Pas assez de tirs pour conclure",
    },
    {
      label: "Arme préférée",
      value: kpi.favoriteWeaponName ?? "—",
      hint: kpi.favoriteWeaponName ? "La plus jouée (nombre de challenges)" : "Aucun challenge",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(({ label, value, hint }) => (
        <Card key={label}>
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="text-2xl">{value}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>
        </Card>
      ))}
    </div>
  );
}
