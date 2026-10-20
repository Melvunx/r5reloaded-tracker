import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { WEAPONS } from "@/config/apex-weapons.config";
import { ChallengeSchema, DeleteChallengeSchema, ManualChallengeSchema } from "./challenge";
import { RANGES, parseChartFilters } from "./filters";
import { DeleteImportSchema } from "./import";
import { DeleteSensitivitySchema, SensitivityFormSchema } from "./mouse-settings";

// Tout ce qui peut arriver dans un paramètre d'action ou d'URL
const anything = fc.anything({ withBigInt: true, withNullPrototype: true, withDate: true });

describe("schémas : jamais d'exception sur une entrée quelconque", () => {
  const schemas = {
    ChallengeSchema,
    ManualChallengeSchema,
    DeleteChallengeSchema,
    DeleteImportSchema,
    SensitivityFormSchema,
    DeleteSensitivitySchema,
  };

  for (const [name, schema] of Object.entries(schemas)) {
    it(name, () => {
      fc.assert(
        fc.property(anything, (input) => {
          expect(() => schema.safeParse(input)).not.toThrow();
        }),
      );
    });
  }

  it("les schémas de suppression refusent tout ce qui n'est pas un identifiant", () => {
    fc.assert(
      fc.property(anything, (input) => {
        for (const schema of [DeleteChallengeSchema, DeleteImportSchema, DeleteSensitivitySchema]) {
          const result = schema.safeParse(input);
          if (result.success) expect(typeof result.data.id).toBe("string");
        }
      }),
    );
  });

  it("refusent un identifiant qui ressemble à du SQL ou à un chemin", () => {
    for (const id of ["' OR 1=1 --", "../../etc/passwd", "a b", "", "x".repeat(500), "<script>"]) {
      expect(DeleteChallengeSchema.safeParse({ id }).success).toBe(false);
      expect(DeleteImportSchema.safeParse({ id }).success).toBe(false);
      expect(DeleteSensitivitySchema.safeParse({ id }).success).toBe(false);
    }
  });
});

describe("ChallengeSchema (propriétés)", () => {
  const consistent = fc
    .record({ total: fc.integer({ min: 1, max: 5000 }), kills: fc.nat(100), damage: fc.nat(50000), roundtime: fc.integer({ min: 1, max: 900 }) })
    .chain((base) =>
      fc.integer({ min: 0, max: base.total }).chain((hit) => fc.integer({ min: 0, max: hit }).map((crit) => ({ ...base, hit, crit }))),
    );

  const toInput = ({ total, hit, crit, kills, damage, roundtime }: { total: number; hit: number; crit: number; kills: number; damage: number; roundtime: number }, weapon: string) => ({
    challengeName: "STRAFING DUMMY",
    weapon,
    shotsHit: String(hit),
    totalShots: String(total),
    criticalShots: String(crit),
    kills: String(kills),
    damage: String(damage),
    roundtime: String(roundtime),
    accuracy: `${((hit / total) * 100).toFixed(2)}%`,
  });

  it("accepte toute partie cohérente, pour toutes les armes, et recalcule la précision", () => {
    fc.assert(
      fc.property(consistent, fc.constantFrom(...WEAPONS), (game, weapon) => {
        const result = ChallengeSchema.safeParse(toInput(game, weapon.name));
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.weaponId).toBe(weapon.slug);
          expect(Math.abs(result.data.accuracy - (game.hit / game.total) * 100)).toBeLessThanOrEqual(0.005 + 1e-9);
        }
      }),
    );
  });

  it("refuse toujours plus de tirs touchés que de tirs totaux", () => {
    fc.assert(
      fc.property(consistent, fc.integer({ min: 1, max: 100 }), (game, extra) => {
        const input = toInput(game, "Volt");
        input.shotsHit = String(game.total + extra);
        input.accuracy = "100";
        expect(ChallengeSchema.safeParse(input).success).toBe(false);
      }),
    );
  });

  it("refuse toujours plus de tirs critiques que de tirs touchés", () => {
    fc.assert(
      fc.property(consistent, fc.integer({ min: 1, max: 100 }), (game, extra) => {
        const input = toInput(game, "Volt");
        input.criticalShots = String(game.hit + extra);
        expect(ChallengeSchema.safeParse(input).success).toBe(false);
      }),
    );
  });

  it("refuse une précision qui s'écarte de plus de 0,5 point de touchés / tirs", () => {
    fc.assert(
      fc.property(consistent, fc.double({ min: 0.51, max: 40, noNaN: true }), (game, gap) => {
        const real = (game.hit / game.total) * 100;
        const claimed = real + gap > 100 ? real - gap : real + gap;
        if (claimed < 0 || claimed > 100) return;
        const input = toInput(game, "Volt");
        input.accuracy = claimed.toFixed(2);
        expect(ChallengeSchema.safeParse(input).success).toBe(false);
      }),
    );
  });
});

describe("parseChartFilters (propriétés)", () => {
  const param = fc.oneof(fc.string(), fc.array(fc.string(), { maxLength: 4 }), fc.constant(undefined));

  it("ne plante jamais et renvoie toujours une période valide", () => {
    fc.assert(
      fc.property(fc.record({ weapon: param, weaponType: param, range: param, challenge: param, compare: param }, { requiredKeys: [] }), (params) => {
        const filters = parseChartFilters(params);
        expect(RANGES).toContain(filters.range);
        expect(filters.compare === undefined || filters.compare !== filters.weapon).toBe(true);
        if (filters.compare !== undefined) expect(filters.weapon).toBeDefined();
      }),
    );
  });

  it("ignore les paramètres inconnus", () => {
    expect(parseChartFilters({ range: "1m", __proto__: "x", admin: "1", "constructor": "y" } as never)).toEqual({ range: "1m" });
  });
});
