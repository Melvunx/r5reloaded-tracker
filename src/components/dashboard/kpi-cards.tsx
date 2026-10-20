import type { ReactNode } from "react";
import { WeaponImage } from "@/components/weapon-image";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPlayTime } from "@/lib/stats";
import type { DashboardStats } from "@/lib/stats-service";

export function KpiCards({ kpi }: { kpi: DashboardStats["kpi"] }) {
  const { favoriteWeapon } = kpi;
  const items: { label: string; value: ReactNode; hint: string; numeric?: boolean }[] = [
    { label: "Précision globale", value: `${kpi.accuracy.toFixed(2)} %`, hint: "Touchés / tirs totaux", numeric: true },
    { label: "Challenges joués", value: String(kpi.challenges), hint: "Sur la période", numeric: true },
    { label: "Temps de jeu", value: formatPlayTime(kpi.playTime), hint: "Durée cumulée des challenges", numeric: true },
    {
      label: "Meilleure arme",
      value: kpi.bestWeaponName ? <span className="weapon-name">{kpi.bestWeaponName}</span> : "—",
      hint: kpi.bestWeaponName ? "Meilleure précision (100 tirs min.)" : "Pas assez de tirs pour conclure",
    },
    {
      label: "Arme préférée",
      // Mêmes attributs que dans le tableau : l'effet « arme préférée » de globals.css s'applique tout seul
      value: favoriteWeapon ? (
        <span className="flex items-center gap-2" data-favorite="overall" data-type={favoriteWeapon.type}>
          <WeaponImage weapon={favoriteWeapon} base={{ width: 48, height: 24 }} />
          <span className="weapon-name">{favoriteWeapon.name}</span>
        </span>
      ) : (
        "—"
      ),
      hint: favoriteWeapon ? "La plus jouée, sur tout l'historique" : "Aucun challenge",
    },
  ];

  return (
    <Stagger nested className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(({ label, value, hint, numeric }) => (
        <StaggerItem key={label}>
          <Card className="h-full">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className={numeric ? "font-mono text-2xl" : "text-2xl"}>{value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>
          </Card>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
