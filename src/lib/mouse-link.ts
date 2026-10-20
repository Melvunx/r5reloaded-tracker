import { APP_TIME_ZONE } from "@/config/time.config";
import type { ChartRow } from "@/lib/chart-rows";
import { cmPer360, edpi, pickActive } from "@/lib/mouse";

type Setting = { effectiveFrom: Date; createdAt: Date; mouseDpi: number; mouseSensitivity: number };

type Granularity = "session" | "day";

/** Réglage souris tel qu'affiché : DPI, sensibilité et les deux mesures qui en découlent. */
export type MouseInfo = { dpi: number; sensitivity: number; edpi: number; cmPer360: number };

export function describeSetting(setting: Pick<Setting, "mouseDpi" | "mouseSensitivity">): MouseInfo {
  return {
    dpi: setting.mouseDpi,
    sensitivity: setting.mouseSensitivity,
    edpi: edpi(setting.mouseDpi, setting.mouseSensitivity),
    cmPer360: cmPer360(setting.mouseDpi, setting.mouseSensitivity),
  };
}

function zoneOffsetMs(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * Dernier instant d'un jour (`YYYY-MM-DD`) dans un fuseau. Le décalage est lu à cet instant : sur le seul jour d'un
 * changement d'heure, il peut être faux d'une heure, ce qui est sans conséquence pour rattacher un réglage à un jour.
 */
export function endOfDayInZone(day: string, timeZone = APP_TIME_ZONE) {
  const guess = new Date(`${day}T23:59:59.999Z`);
  return new Date(guess.getTime() - zoneOffsetMs(guess, timeZone));
}

/** Instant représentatif d'une ligne : la partie elle-même, ou la fin du jour pour une ligne agrégée par jour. */
function rowTime(row: ChartRow, granularity: Granularity) {
  return granularity === "day" ? endOfDayInZone(row.date) : new Date(row.date);
}

/** Ajoute à chaque ligne le réglage souris actif à ce moment (null avant le premier réglage saisi). */
export function attachMouse(rows: ChartRow[], settings: readonly Setting[], granularity: Granularity): ChartRow[] {
  return rows.map((row) => {
    const active = pickActive(settings, rowTime(row, granularity));
    return { ...row, mouse: active ? describeSetting(active) : null };
  });
}

export type MouseMarker = { x: string; label: string; info: MouseInfo };

/**
 * Changements de réglage visibles sur le graphique : un marqueur sur la première ligne qui suit l'application du
 * réglage. Pas de marqueur si le réglage précède toutes les lignes (rien ne change à l'écran) ou les suit toutes.
 */
export function findMarkers(rows: ChartRow[], settings: readonly Setting[], granularity: Granularity): MouseMarker[] {
  const ascending = [...settings].sort(
    (a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime() || a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const markers = new Map<string, MouseMarker>();
  for (const setting of ascending) {
    const index = rows.findIndex((row) => rowTime(row, granularity) >= setting.effectiveFrom);
    if (index <= 0) continue;
    const info = describeSetting(setting);
    // Deux réglages tombant sur la même ligne : le plus récent est celui qui reste actif
    markers.set(rows[index].date, { x: rows[index].date, label: `${info.dpi} DPI · ${info.sensitivity}`, info });
  }
  return [...markers.values()];
}

export type MousePeriod<T extends Setting> = { setting: T | null; from: Date | null; to: Date | null };

/**
 * Découpe le temps en périodes de réglage : « avant le premier réglage » (setting null), puis une période par
 * réglage jusqu'au suivant. Un réglage écrasé par un autre à la même date (période vide) est écarté.
 */
export function buildPeriods<T extends Setting>(settings: readonly T[]): MousePeriod<T>[] {
  const ascending = [...settings].sort(
    (a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime() || a.createdAt.getTime() - b.createdAt.getTime(),
  );
  if (ascending.length === 0) return [];

  const periods: MousePeriod<T>[] = [{ setting: null, from: null, to: ascending[0].effectiveFrom }];
  ascending.forEach((setting, index) => {
    periods.push({ setting, from: setting.effectiveFrom, to: ascending[index + 1]?.effectiveFrom ?? null });
  });
  return periods.filter((period) => !(period.from && period.to && period.from >= period.to));
}
