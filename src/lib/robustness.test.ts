import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { mergeSeries } from "./chart-rows";
import type { ChartPoint } from "./chart-service";
import { cmPer360, pickActive } from "./mouse";
import { buildPeriods, endOfDayInZone } from "./mouse-link";
import { formatPlayTime, weightedAccuracy } from "./stats";

const point = (date: string, accuracy: number): ChartPoint => ({
  date,
  accuracy,
  shotsHit: 0,
  totalShots: 0,
  sessions: 1,
  weapons: ["Volt"],
});

// Jours d'octobre / novembre 2026 (couvre le passage à l'heure d'hiver du 25 octobre)
const day = fc.integer({ min: 0, max: 60 }).map((offset) => new Date(Date.UTC(2026, 9, 1 + offset)).toISOString().slice(0, 10));

const series = fc
  .array(fc.record({ date: day, accuracy: fc.double({ min: 0, max: 100, noNaN: true }) }), { maxLength: 15 })
  .map((items) => items.sort((a, b) => a.date.localeCompare(b.date)).map(({ date, accuracy }) => point(date, accuracy)));

describe("weightedAccuracy / formatPlayTime", () => {
  it("reste entre 0 et 100 dès que touchés <= tirs", () => {
    fc.assert(
      fc.property(fc.nat(100_000), fc.nat(100_000), (a, b) => {
        const [hit, total] = a <= b ? [a, b] : [b, a];
        const value = weightedAccuracy(hit, total);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }),
    );
  });

  it("ne renvoie jamais NaN ni Infinity", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (hit, total) => {
        expect(Number.isFinite(weightedAccuracy(hit, total))).toBe(true);
      }),
    );
  });

  it("formate n'importe quelle durée sans planter", () => {
    fc.assert(
      fc.property(fc.nat(10_000_000), (seconds) => {
        expect(formatPlayTime(seconds)).toMatch(/\d/);
      }),
    );
  });
});

describe("mergeSeries (propriétés)", () => {
  it("garde tous les points de chaque série, dans l'ordre, sur des lignes triées par date", () => {
    fc.assert(
      fc.property(series, series, (a, b) => {
        const rows = mergeSeries(a, b);
        expect(rows.map((row) => row.accuracyA).filter((value) => value !== null)).toEqual(a.map((p) => p.accuracy));
        expect(rows.map((row) => row.accuracyB).filter((value) => value !== null)).toEqual(b.map((p) => p.accuracy));
        expect(rows.map((row) => row.date)).toEqual(rows.map((row) => row.date).sort());
        expect(rows.length).toBeGreaterThanOrEqual(Math.max(a.length, b.length));
        expect(rows.length).toBeLessThanOrEqual(a.length + b.length);
      }),
    );
  });
});

describe("endOfDayInZone (propriétés)", () => {
  const zones = ["Europe/Paris", "UTC", "America/New_York", "Asia/Tokyo", "Pacific/Auckland"];

  it("tombe sur le bon jour dans le fuseau et la milliseconde suivante sur le jour d'après", () => {
    const calendarDay = (date: Date, timeZone: string) => new Intl.DateTimeFormat("sv-SE", { timeZone }).format(date);
    fc.assert(
      fc.property(day, fc.constantFrom(...zones), (value, timeZone) => {
        const end = endOfDayInZone(value, timeZone);
        expect(calendarDay(end, timeZone)).toBe(value);
        const next = new Date(Date.UTC(+value.slice(0, 4), +value.slice(5, 7) - 1, +value.slice(8, 10) + 1)).toISOString().slice(0, 10);
        // Hors jour de changement d'heure, la milliseconde suivante ouvre le jour suivant
        if (Math.abs(end.getTime() + 1 - endOfDayInZone(next, timeZone).getTime()) > 25 * 3600_000) return;
        expect(calendarDay(new Date(end.getTime() + 1_000), timeZone)).toBe(next);
      }),
    );
  });
});

describe("périodes et réglages de souris (propriétés)", () => {
  const settings = fc.array(
    fc.record({
      effectiveFrom: fc.date({ min: new Date("2026-01-01"), max: new Date("2026-12-31"), noInvalidDate: true }),
      createdAt: fc.date({ min: new Date("2026-01-01"), max: new Date("2026-12-31"), noInvalidDate: true }),
      mouseDpi: fc.integer({ min: 100, max: 32000 }),
      mouseSensitivity: fc.double({ min: 0.01, max: 100, noNaN: true }),
    }),
    { maxLength: 8 },
  );

  it("découpe le temps sans trou ni chevauchement", () => {
    fc.assert(
      fc.property(settings, (list) => {
        const periods = buildPeriods(list);
        if (list.length === 0) {
          expect(periods).toEqual([]);
          return;
        }
        expect(periods[0].from).toBeNull();
        expect(periods[periods.length - 1].to).toBeNull();
        for (let i = 1; i < periods.length; i++) {
          expect(periods[i].from?.getTime()).toBe(periods[i - 1].to?.getTime());
        }
      }),
    );
  });

  it("le réglage actif à un instant est celui de la période qui le contient", () => {
    fc.assert(
      fc.property(settings, fc.date({ min: new Date("2025-12-01"), max: new Date("2027-01-31"), noInvalidDate: true }), (list, at) => {
        const period = buildPeriods(list).find((p) => (!p.from || p.from <= at) && (!p.to || at < p.to));
        expect(pickActive(list, at)).toBe(period?.setting ?? undefined);
      }),
    );
  });

  it("cm/360° décroît quand le DPI ou la sensibilité augmente", () => {
    fc.assert(
      fc.property(fc.integer({ min: 100, max: 16000 }), fc.double({ min: 0.01, max: 50, noNaN: true }), (dpi, sens) => {
        expect(cmPer360(dpi * 2, sens)).toBeLessThan(cmPer360(dpi, sens));
        expect(cmPer360(dpi, sens * 2)).toBeLessThan(cmPer360(dpi, sens));
      }),
    );
  });
});
