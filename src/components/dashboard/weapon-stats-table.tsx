"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WEAPON_TYPE, getWeaponImagePath } from "@/config/apex-weapons.config";
import type { WeaponStat } from "@/lib/stats-service";
import { cn } from "@/lib/utils";

type SortKey = "name" | "challenges" | "accuracy" | "criticalRate" | "avgDamage" | "avgKills" | "bestAccuracy" | "trend";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Arme" },
  { key: "challenges", label: "Challenges" },
  { key: "accuracy", label: "Précision" },
  { key: "criticalRate", label: "% critiques" },
  { key: "avgDamage", label: "Dégâts moy." },
  { key: "avgKills", label: "Kills moy." },
  { key: "bestAccuracy", label: "Meilleure" },
  { key: "trend", label: "Tendance" },
];

function compare(a: WeaponStat, b: WeaponStat, key: SortKey) {
  if (key === "name") return a.name.localeCompare(b.name, "fr");
  // Sans période précédente (null), la tendance passe après toutes les autres
  const left = a[key] ?? -Infinity;
  const right = b[key] ?? -Infinity;
  return left - right;
}

function Trend({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  if (value === 0) return <span className="text-muted-foreground">=</span>;
  return (
    <span className={cn(value > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
      {value > 0 ? "▲ +" : "▼ "}
      {value.toFixed(2)} pts
    </span>
  );
}

export function WeaponStatsTable({ weapons, hasTrend }: { weapons: WeaponStat[]; hasTrend: boolean }) {
  const [sort, setSort] = useState<{ key: SortKey; direction: 1 | -1 }>({ key: "accuracy", direction: -1 });

  const rows = [...weapons].sort((a, b) => compare(a, b, sort.key) * sort.direction);
  const columns = hasTrend ? COLUMNS : COLUMNS.filter(({ key }) => key !== "trend");

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key ? { key, direction: current.direction === 1 ? -1 : 1 } : { key, direction: key === "name" ? 1 : -1 },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques par arme</CardTitle>
        <CardDescription>
          Précision pondérée par le nombre de tirs.
          {hasTrend && " La tendance compare à la période précédente de même durée."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(({ key, label }) => (
                <TableHead
                  key={key}
                  className={key === "name" ? undefined : "text-right"}
                  aria-sort={sort.key === key ? (sort.direction === 1 ? "ascending" : "descending") : undefined}
                >
                  <Button variant="ghost" size="sm" onClick={() => toggleSort(key)}>
                    {label}
                    {sort.key === key && (sort.direction === 1 ? " ↑" : " ↓")}
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((weapon) => (
              <TableRow key={weapon.slug}>
                <TableCell>
                  <span className="flex items-center gap-2 font-medium" data-favorite={weapon.favorite ?? undefined} data-type={weapon.type}>
                    <Image
                      src={getWeaponImagePath(weapon.type, weapon.slug)}
                      alt=""
                      width={40}
                      height={20}
                      className="h-5 w-10 object-contain"
                    />
                    {weapon.name}
                    {weapon.favorite === "overall" && <Badge variant="secondary">Préférée</Badge>}
                    {weapon.favorite === "category" && <Badge variant="outline">Favorite · {WEAPON_TYPE[weapon.type]}</Badge>}
                  </span>
                </TableCell>
                <TableCell className="text-right">{weapon.challenges}</TableCell>
                <TableCell className="text-right">{weapon.accuracy.toFixed(2)} %</TableCell>
                <TableCell className="text-right">{weapon.criticalRate.toFixed(1)} %</TableCell>
                <TableCell className="text-right">{weapon.avgDamage}</TableCell>
                <TableCell className="text-right">{weapon.avgKills}</TableCell>
                <TableCell className="text-right">{weapon.bestAccuracy.toFixed(2)} %</TableCell>
                {hasTrend && (
                  <TableCell className="text-right">
                    <Trend value={weapon.trend} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
