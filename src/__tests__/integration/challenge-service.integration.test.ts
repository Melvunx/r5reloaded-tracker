import { describe, expect, it } from "vitest";
import { createManualChallenge, deleteManualChallenge, listManualChallenges, MANUAL_HISTORY_LIMIT } from "@/lib/challenge-service";
import { prisma } from "@/lib/prisma";
import { ManualChallengeSchema } from "@/schema/challenge";
import { makeChallenge } from "./factories";

const input = {
  challengeName: "STRAFING DUMMY",
  weapon: "R-99",
  shotsHit: "50",
  totalShots: "100",
  criticalShots: "5",
  kills: "3",
  damage: "900",
  roundtime: "60",
  accuracy: "50",
  playedAt: "2026-10-19",
};

describe("challenge-service", () => {
  it("enregistre une saisie validée par le schéma, marquée « manual » et sans lot", async () => {
    const data = ManualChallengeSchema.parse(input);
    const { id } = await createManualChallenge(data);

    const saved = await prisma.challenge.findUniqueOrThrow({ where: { id } });
    expect(saved).toMatchObject({ weaponId: "r99", source: "manual", batchId: null, accuracy: 50 });
    expect(saved.playedAt.toISOString()).toBe("2026-10-19T00:00:00.000Z");
  });

  it("n'efface jamais un challenge importé, même avec son identifiant exact", async () => {
    const batch = await prisma.importBatch.create({ data: { fileName: "a.txt", fileHash: "h" } });
    const imported = await makeChallenge({ source: "import", batchId: batch.id });

    expect(await deleteManualChallenge(imported.id)).toBe(false);
    expect(await prisma.challenge.count()).toBe(1);
  });

  it("supprime une saisie manuelle, une seule fois", async () => {
    const manual = await makeChallenge({ source: "manual" });
    expect(await deleteManualChallenge(manual.id)).toBe(true);
    expect(await deleteManualChallenge(manual.id)).toBe(false);
  });

  it("liste uniquement les saisies manuelles, les plus récentes d'abord et en nombre limité", async () => {
    const batch = await prisma.importBatch.create({ data: { fileName: "a.txt", fileHash: "h" } });
    await makeChallenge({ source: "import", batchId: batch.id });
    for (let i = 0; i < MANUAL_HISTORY_LIMIT + 2; i++) {
      await makeChallenge({ playedAt: new Date(Date.UTC(2026, 9, 1, i)) });
    }

    const list = await listManualChallenges();
    expect(list).toHaveLength(MANUAL_HISTORY_LIMIT);
    expect(list[0].playedAt.getTime()).toBeGreaterThan(list[1].playedAt.getTime());
  });

  it("refuse une arme absente de la base (clé étrangère)", async () => {
    await expect(makeChallenge({ weaponId: "bocek" })).rejects.toThrow();
  });
});
