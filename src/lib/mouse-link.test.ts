import { describe, expect, it } from "vitest";
import type { ChartRow } from "./chart-rows";
import { attachMouse, buildPeriods, describeSetting, endOfDayInZone, findMarkers } from "./mouse-link";

const setting = (effectiveFrom: string, mouseDpi: number, mouseSensitivity: number, createdAt = effectiveFrom) => ({
  effectiveFrom: new Date(effectiveFrom),
  createdAt: new Date(createdAt),
  mouseDpi,
  mouseSensitivity,
});

const row = (date: string): ChartRow => ({ date, accuracyA: 40, accuracyB: null, a: null, b: null });

describe("endOfDayInZone", () => {
  it("donne la fin du jour à Paris en heure d'été et d'hiver", () => {
    expect(endOfDayInZone("2026-10-20", "Europe/Paris").toISOString()).toBe("2026-10-20T21:59:59.999Z");
    expect(endOfDayInZone("2026-12-01", "Europe/Paris").toISOString()).toBe("2026-12-01T22:59:59.999Z");
  });

  it("est correct le jour du passage à l'heure d'hiver", () => {
    expect(endOfDayInZone("2026-10-25", "Europe/Paris").toISOString()).toBe("2026-10-25T22:59:59.999Z");
  });

  it("vaut la fin du jour UTC pour le fuseau UTC", () => {
    expect(endOfDayInZone("2026-10-20", "UTC").toISOString()).toBe("2026-10-20T23:59:59.999Z");
  });
});

describe("describeSetting", () => {
  it("calcule eDPI et cm/360°", () => {
    const info = describeSetting({ mouseDpi: 800, mouseSensitivity: 1 });
    expect(info.edpi).toBe(800);
    expect(info.cmPer360).toBeCloseTo(51.95, 1);
  });
});

describe("attachMouse", () => {
  const settings = [setting("2026-10-10T00:00:00Z", 800, 1), setting("2026-10-20T08:00:00Z", 1600, 0.5)];

  it("associe le réglage actif à chaque ligne par jour (fin de journée)", () => {
    const rows = attachMouse([row("2026-10-05"), row("2026-10-12"), row("2026-10-20")], settings, "day");
    expect(rows.map((r) => r.mouse?.dpi ?? null)).toEqual([null, 800, 1600]);
  });

  it("utilise l'instant exact en mode partie", () => {
    const rows = attachMouse([row("2026-10-20T07:59:00Z"), row("2026-10-20T08:00:00Z")], settings, "session");
    expect(rows.map((r) => r.mouse?.dpi)).toEqual([800, 1600]);
  });
});

describe("findMarkers", () => {
  const settings = [setting("2026-10-10T00:00:00Z", 800, 1), setting("2026-10-15T12:00:00Z", 1600, 0.5)];
  const rows = [row("2026-10-12"), row("2026-10-14"), row("2026-10-16"), row("2026-10-18")];

  it("place un marqueur sur la première ligne suivant un changement", () => {
    const markers = findMarkers(rows, settings, "day");
    expect(markers.map((m) => [m.x, m.info.dpi])).toEqual([["2026-10-16", 1600]]);
  });

  it("ignore un réglage antérieur à toutes les lignes ou postérieur", () => {
    expect(findMarkers(rows, [setting("2026-01-01T00:00:00Z", 800, 1)], "day")).toEqual([]);
    expect(findMarkers(rows, [setting("2026-12-01T00:00:00Z", 800, 1)], "day")).toEqual([]);
  });

  it("garde le réglage le plus récent quand deux tombent sur la même ligne", () => {
    const markers = findMarkers(
      rows,
      [setting("2026-10-15T10:00:00Z", 800, 1), setting("2026-10-15T20:00:00Z", 1600, 0.5)],
      "day",
    );
    expect(markers).toHaveLength(1);
    expect(markers[0].info.dpi).toBe(1600);
  });
});

describe("buildPeriods", () => {
  it("renvoie vide sans réglage", () => {
    expect(buildPeriods([])).toEqual([]);
  });

  it("découpe avant / pendant / après chaque réglage", () => {
    const a = setting("2026-10-10T00:00:00Z", 800, 1);
    const b = setting("2026-10-15T00:00:00Z", 1600, 0.5);
    const periods = buildPeriods([b, a]);
    expect(periods.map((p) => [p.setting?.mouseDpi ?? null, p.from?.toISOString() ?? null, p.to?.toISOString() ?? null])).toEqual([
      [null, null, "2026-10-10T00:00:00.000Z"],
      [800, "2026-10-10T00:00:00.000Z", "2026-10-15T00:00:00.000Z"],
      [1600, "2026-10-15T00:00:00.000Z", null],
    ]);
  });

  it("écarte un réglage écrasé à la même date par un réglage créé plus tard", () => {
    const old = setting("2026-10-10T00:00:00Z", 800, 1, "2026-10-10T08:00:00Z");
    const replacement = setting("2026-10-10T00:00:00Z", 1000, 1, "2026-10-10T09:00:00Z");
    const periods = buildPeriods([old, replacement]);
    expect(periods.map((p) => p.setting?.mouseDpi ?? null)).toEqual([null, 1000]);
  });
});
