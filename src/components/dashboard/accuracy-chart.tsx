"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { APP_TIME_ZONE } from "@/config/time.config";
import type { ChartRow, SeriesStats } from "@/lib/chart-rows";
import type { ChartData } from "@/lib/chart-service";

const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const sessionFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
});
const hourFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE });

type Granularity = ChartData["granularity"];

// Un jour (`YYYY-MM-DD`) est déjà dans le fuseau de l'app : on le formate en UTC pour ne pas le décaler
function formatTick(date: string, granularity: Granularity) {
  return granularity === "day" ? dayFormat.format(new Date(`${date}T00:00:00Z`)) : hourFormat.format(new Date(date));
}

function formatLabel(date: string, granularity: Granularity) {
  return granularity === "day" ? dayFormat.format(new Date(`${date}T00:00:00Z`)) : sessionFormat.format(new Date(date));
}

function SeriesLine({ name, color, stats }: { name?: string; color: string; stats: SeriesStats }) {
  return (
    <div className="grid gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ background: color }} />
        <span className="text-muted-foreground">{name ?? stats.weapons.join(", ")}</span>
      </div>
      <div>
        Précision <strong className="font-mono">{stats.accuracy.toFixed(2)} %</strong>
      </div>
      <div className="text-muted-foreground">
        {stats.shotsHit} touchés / {stats.totalShots} tirs
        {stats.sessions > 1 && ` · ${stats.sessions} parties`}
      </div>
    </div>
  );
}

function RowTooltip({ row, granularity, labels }: { row: ChartRow; granularity: Granularity; labels: Labels }) {
  return (
    <div className="grid gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{formatLabel(row.date, granularity)}</div>
      {row.a && <SeriesLine name={labels.b ? labels.a : undefined} color="var(--chart-1)" stats={row.a} />}
      {row.b && <SeriesLine name={labels.b ?? undefined} color="var(--chart-2)" stats={row.b} />}
    </div>
  );
}

type Labels = { a: string; b: string | null };

export function AccuracyChart({ granularity, rows, compare, labels }: ChartData & { labels: Labels }) {
  const chartConfig = {
    accuracyA: { label: compare ? labels.a : "Précision", color: "var(--chart-1)" },
    ...(compare && labels.b ? { accuracyB: { label: labels.b, color: "var(--chart-2)" } } : {}),
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{compare ? `${labels.a} contre ${labels.b}` : "Précision"}</CardTitle>
        <CardDescription>
          {granularity === "day"
            ? "Précision pondérée par jour (touchés / tirs totaux)."
            : "Précision de chaque partie."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <LineChart data={rows} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value: string) => formatTick(value, granularity)}
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value: number) => `${value} %`}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                return active && row ? <RowTooltip row={row} granularity={granularity} labels={labels} /> : null;
              }}
            />
            {compare && <ChartLegend content={<ChartLegendContent />} />}
            <Line
              dataKey="accuracyA"
              type="monotone"
              stroke="var(--color-accuracyA)"
              strokeWidth={2}
              dot={rows.length < 40}
              connectNulls
            />
            {compare && (
              <Line
                dataKey="accuracyB"
                type="monotone"
                stroke="var(--color-accuracyB)"
                strokeWidth={2}
                dot={rows.length < 40}
                connectNulls
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
