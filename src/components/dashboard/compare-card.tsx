import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WeaponImage } from "@/components/weapon-image";
import type { WeaponStat } from "@/lib/stats-service";

type Metric = {
  label: string;
  value: (stat: WeaponStat) => number;
  format: (value: number) => string;
  unit?: string;
};

const METRICS: Metric[] = [
  { label: "Précision", value: (s) => s.accuracy, format: (v) => v.toFixed(2), unit: "%" },
  { label: "% critiques", value: (s) => s.criticalRate, format: (v) => v.toFixed(1), unit: "%" },
  { label: "Dégâts moyens", value: (s) => s.avgDamage, format: (v) => String(Math.round(v)) },
  { label: "Kills moyens", value: (s) => s.avgKills, format: (v) => v.toFixed(1) },
  { label: "Meilleure précision", value: (s) => s.bestAccuracy, format: (v) => v.toFixed(2), unit: "%" },
  { label: "Challenges joués", value: (s) => s.challenges, format: (v) => String(v) },
];

function WeaponHead({ stat, fallback }: { stat: WeaponStat | undefined; fallback: string }) {
  return (
    <span className="flex items-center justify-end gap-2">
      {stat && <WeaponImage weapon={stat} />}
      <span className="weapon-name">{stat?.name ?? fallback}</span>
    </span>
  );
}

/** Statistiques des deux armes côte à côte ; la meilleure valeur de chaque ligne est mise en avant. */
export function CompareCard({ a, b, nameA, nameB }: { a?: WeaponStat; b?: WeaponStat; nameA: string; nameB: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison</CardTitle>
        <CardDescription>
          Sur la période choisie. L&apos;écart est calculé en faveur de {nameA} : positif = {nameA} devant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead className="text-right">
                <WeaponHead stat={a} fallback={nameA} />
              </TableHead>
              <TableHead className="text-right">
                <WeaponHead stat={b} fallback={nameB} />
              </TableHead>
              <TableHead className="text-right">Écart</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {METRICS.map(({ label, value, format, unit }) => {
              const left = a ? value(a) : null;
              const right = b ? value(b) : null;
              const diff = left !== null && right !== null ? left - right : null;
              const cell = (own: number | null, other: number | null) => (
                <TableCell
                  className={`text-right font-mono tabular-nums ${own !== null && other !== null && own > other ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {own === null ? "—" : `${format(own)}${unit ? ` ${unit}` : ""}`}
                </TableCell>
              );
              return (
                <TableRow key={label}>
                  <TableCell className="font-medium">{label}</TableCell>
                  {cell(left, right)}
                  {cell(right, left)}
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {diff === null ? "—" : `${diff > 0 ? "+" : ""}${format(diff)}${unit ? ` ${unit === "%" ? "pts" : unit}` : ""}`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
