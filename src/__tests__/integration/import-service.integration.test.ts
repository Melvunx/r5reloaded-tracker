import { describe, expect, it } from "vitest";
import { createImportBatch, listImportBatches, removeImportBatch, HISTORY_LIMIT } from "@/lib/import-service";
import type { ImportAnalysis } from "@/lib/import-file";
import { prisma } from "@/lib/prisma";
import { parseR5Export } from "@/lib/r5-parser";
import { makeChallenge } from "./factories";

const SIGNATURE = "=== Aim Trainer ===";
const HEADER = "ChallengeName, ShotsHit, Kills, Weapon, Accuracy, Damage, CriticalShots, TotalShots, Roundtime";

function analysis(fileHash: string, lines: string[], fileName = `${fileHash}.txt`): ImportAnalysis {
  const parsed = parseR5Export([SIGNATURE, "", HEADER, ...lines].join("\r\n"), SIGNATURE);
  if (!parsed.success) throw new Error(parsed.error);
  return { fileName, fileHash, playedAt: new Date("2026-10-20T11:06:30Z"), valid: parsed.valid, invalid: parsed.invalid, duplicates: parsed.duplicates };
}

const LINES = [
  "STRAFING DUMMY, 193, 19, Flatline, 46.61%, 3888, 8, 414, 60",
  "STRAFING DUMMY, 182, 14, Volt, 44.49%, 2928, 7, 409, 60",
];

describe("import-service", () => {
  it("crée le lot et tous ses challenges d'un coup", async () => {
    const created = await createImportBatch(analysis("hash-1", LINES));
    expect(created).toMatchObject({ inserted: 2 });

    const challenges = await prisma.challenge.findMany({ where: { batchId: created?.id } });
    expect(challenges).toHaveLength(2);
    expect(challenges.every((c) => c.source === "import" && c.playedAt.toISOString() === "2026-10-20T11:06:30.000Z")).toBe(true);
  });

  it("refuse un second import du même fichier sans rien insérer", async () => {
    await createImportBatch(analysis("hash-dup", LINES));
    const second = await createImportBatch(analysis("hash-dup", LINES, "copie.txt"));

    expect(second).toBeNull();
    expect(await prisma.importBatch.count()).toBe(1);
    expect(await prisma.challenge.count()).toBe(2);
  });

  it("supprime le lot et ses challenges seulement, en comptant ce qui part", async () => {
    const batch = await createImportBatch(analysis("hash-a", LINES));
    const other = await createImportBatch(analysis("hash-b", [LINES[0]]));
    await makeChallenge({ source: "manual" });

    expect(await removeImportBatch(batch!.id)).toBe(2);
    expect(await prisma.challenge.count({ where: { batchId: other!.id } })).toBe(1);
    expect(await prisma.challenge.count({ where: { source: "manual" } })).toBe(1);
    expect(await prisma.importBatch.count()).toBe(1);
  });

  it("renvoie null pour un lot déjà annulé ou inconnu", async () => {
    const batch = await createImportBatch(analysis("hash-c", LINES));
    expect(await removeImportBatch(batch!.id)).toBe(2);
    expect(await removeImportBatch(batch!.id)).toBeNull();
    expect(await removeImportBatch("inconnu0123456789abcdefgh")).toBeNull();
  });

  it("permet de réimporter un fichier après l'avoir annulé", async () => {
    const batch = await createImportBatch(analysis("hash-d", LINES));
    await removeImportBatch(batch!.id);
    expect(await createImportBatch(analysis("hash-d", LINES))).toMatchObject({ inserted: 2 });
  });

  it("liste les imports du plus récent au plus ancien, limités à l'historique", async () => {
    for (let i = 0; i < HISTORY_LIMIT + 3; i++) await createImportBatch(analysis(`hash-${i}`, [LINES[0]]));
    const list = await listImportBatches();

    expect(list).toHaveLength(HISTORY_LIMIT);
    expect(list[0].fileName).toBe(`hash-${HISTORY_LIMIT + 2}.txt`);
    expect(list.every((batch) => batch.challengeCount === 1 && batch.playedAt !== null)).toBe(true);
  });
});
