import { describe, expect, it } from "vitest";
import { cmPer360, edpi, pickActive } from "./mouse";

describe("edpi", () => {
  it("multiplie DPI et sensibilité", () => {
    expect(edpi(800, 1.5)).toBe(1200);
  });
});

describe("cmPer360", () => {
  it("donne ~51,95 cm pour 800 DPI, sensibilité 1,0 et yaw 0,022", () => {
    expect(cmPer360(800, 1)).toBeCloseTo(51.95, 2);
  });

  it("divise par deux la distance quand la sensibilité double", () => {
    expect(cmPer360(800, 2)).toBeCloseTo(cmPer360(800, 1) / 2, 10);
  });

  it("donne le même résultat à eDPI égal", () => {
    expect(cmPer360(1600, 0.5)).toBeCloseTo(cmPer360(800, 1), 10);
  });

  it("accepte un autre yaw", () => {
    expect(cmPer360(800, 1, 0.01)).toBeCloseTo((360 / (800 * 0.01)) * 2.54, 10);
  });
});

describe("pickActive", () => {
  const setting = (id: string, effectiveFrom: string, createdAt = effectiveFrom) => ({
    id,
    effectiveFrom: new Date(effectiveFrom),
    createdAt: new Date(createdAt),
  });
  const history = [setting("a", "2026-01-01"), setting("c", "2026-06-01"), setting("b", "2026-03-01")];

  it("prend le réglage le plus récent déjà en vigueur", () => {
    expect(pickActive(history, new Date("2026-04-15"))?.id).toBe("b");
    expect(pickActive(history, new Date("2026-06-01"))?.id).toBe("c");
    expect(pickActive(history, new Date("2030-01-01"))?.id).toBe("c");
  });

  it("renvoie undefined avant le premier réglage", () => {
    expect(pickActive(history, new Date("2025-12-31"))).toBeUndefined();
    expect(pickActive([], new Date())).toBeUndefined();
  });

  it("départage deux réglages du même jour par date de création", () => {
    const sameDay = [setting("x", "2026-05-01", "2026-05-01T08:00:00Z"), setting("y", "2026-05-01", "2026-05-01T20:00:00Z")];
    expect(pickActive(sameDay, new Date("2026-05-02"))?.id).toBe("y");
  });

  it("ne modifie pas le tableau d'origine", () => {
    const copy = [...history];
    pickActive(history, new Date("2026-04-15"));
    expect(history).toEqual(copy);
  });
});
