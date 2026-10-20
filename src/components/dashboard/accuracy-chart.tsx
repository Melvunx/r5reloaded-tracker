"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { APP_TIME_ZONE } from "@/config/time.config";
import type { ChartData, ChartPoint } from "@/lib/chart-service";

const chartConfig = { accuracy: { label: "Précision", color: "var(--chart-1)" } } satisfies ChartConfig;

const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const sessionFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
});
const hourFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE });

// Un jour (`YYYY-MM-DD`) est déjà dans le fuseau de l'app : on le formate en UTC pour ne pas le décaler
function formatTick(date: string, granularity: ChartData["granularity"]) {
  return granularity === "day" ? dayFormat.format(new Date(`${date}T00:00:00Z`)) : hourFormat.format(new Date(date));
}

function formatLabel(date: string, granularity: ChartData["granularity"]) {
  return granularity === "day" ? dayFormat.format(new Date(`${date}T00:00:00Z`)) : sessionFormat.format(new Date(date));
}

function PointTooltip({ point, granularity }: { point: ChartPoint; granularity: ChartData["granularity"] }) {
  return (
    <div className="grid gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{formatLabel(point.date, granularity)}</div>
      <div className="text-muted-foreground">{point.weapons.join(", ")}</div>
      <div>
        Précision <strong className="font-mono">{point.accuracy.toFixed(2)} %</strong>
      </div>
      <div className="text-muted-foreground">
        {point.shotsHit} touchés / {point.totalShots} tirs
        {point.sessions > 1 && ` · ${point.sessions} parties`}
      </div>
    </div>
  );
}

export function AccuracyChart({ granularity, points }: ChartData) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Précision</CardTitle>
        <CardDescription>
          {granularity === "day"
            ? "Précision pondérée par jour (touchés / tirs totaux)."
            : "Précision de chaque partie."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <LineChart data={points} margin={{ left: 4, right: 12, top: 8 }}>
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
                const point = payload?.[0]?.payload as ChartPoint | undefined;
                return active && point ? <PointTooltip point={point} granularity={granularity} /> : null;
              }}
            />
            <Line dataKey="accuracy" type="monotone" stroke="var(--color-accuracy)" strokeWidth={2} dot={points.length < 40} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
