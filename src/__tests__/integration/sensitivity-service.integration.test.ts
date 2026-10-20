import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { pickActive } from "@/lib/mouse";
import { prisma } from "@/lib/prisma";
import { createSensitivity, deleteSensitivity, getSensitivityAt, listSensitivities } from "@/lib/sensitivity-service";
import { makeSensitivity } from "./factories";

describe("sensitivity-service", () => {
  it("renvoie le réglage le plus récent dont la date est passée, et rien avant le premier", async () => {
    await makeSensitivity("2026-10-10T00:00:00Z", 800, 1);
    await makeSensitivity("2026-10-15T00:00:00Z", 1600, 0.5);

    expect(await getSensitivityAt(new Date("2026-10-09T23:59:59Z"))).toBeUndefined();
    expect((await getSensitivityAt(new Date("2026-10-10T00:00:00Z")))?.mouseDpi).toBe(800);
    expect((await getSensitivityAt(new Date("2026-10-14T00:00:00Z")))?.mouseDpi).toBe(800);
    expect((await getSensitivityAt(new Date("2026-10-15T00:00:00Z")))?.mouseDpi).toBe(1600);
  });

  it("départage deux réglages de même date par la date de création", async () => {
    await makeSensitivity("2026-10-10T00:00:00Z", 800, 1, "2026-10-10T08:00:00Z");
    await makeSensitivity("2026-10-10T00:00:00Z", 1000, 1, "2026-10-10T09:00:00Z");
    expect((await getSensitivityAt(new Date("2026-10-11T00:00:00Z")))?.mouseDpi).toBe(1000);
  });

  it("applique la même règle que pickActive en JavaScript (requête et calcul ne divergent pas)", async () => {
    const times = fc.integer({ min: 0, max: 30 }).map((day) => new Date(Date.UTC(2026, 9, 1 + day, 12)));
    await fc.assert(
      fc.asyncProperty(fc.array(fc.record({ from: times, created: times, dpi: fc.integer({ min: 100, max: 32000 }) }), { minLength: 1, maxLength: 5 }), times, async (items, at) => {
        await prisma.sensitivity.deleteMany();
        for (const item of items) {
          await prisma.sensitivity.create({ data: { effectiveFrom: item.from, createdAt: item.created, mouseDpi: item.dpi, mouseSensitivity: 1 } });
        }
        const all = await listSensitivities();
        expect((await getSensitivityAt(at))?.id).toBe(pickActive(all, at)?.id);
      }),
      { numRuns: 25 },
    );
  });

  it("crée et supprime un réglage, la 2e suppression renvoie false", async () => {
    const { id } = await createSensitivity({ mouseDpi: 800, mouseSensitivity: 1, effectiveFrom: new Date("2026-10-10T00:00:00Z") });
    expect(await deleteSensitivity(id)).toBe(true);
    expect(await deleteSensitivity(id)).toBe(false);
  });
});
