import { prisma } from "@/lib/prisma";

type ChallengeOverrides = Partial<{
  weaponId: string;
  challengeName: string;
  shotsHit: number;
  totalShots: number;
  criticalShots: number;
  kills: number;
  damage: number;
  roundtime: number;
  playedAt: Date | string;
  source: string;
  batchId: string | null;
}>;

/** Challenge cohérent par défaut (50/100 tirs, Volt) ; la précision est recalculée comme le fait l'application. */
export function makeChallenge(overrides: ChallengeOverrides = {}) {
  const shotsHit = overrides.shotsHit ?? 50;
  const totalShots = overrides.totalShots ?? 100;
  return prisma.challenge.create({
    data: {
      weaponId: "volt",
      challengeName: "STRAFING DUMMY",
      criticalShots: 5,
      kills: 3,
      damage: 900,
      roundtime: 60,
      source: "manual",
      ...overrides,
      shotsHit,
      totalShots,
      accuracy: Math.round((shotsHit / totalShots) * 10000) / 100,
      playedAt: new Date(overrides.playedAt ?? "2026-10-20T12:00:00Z"),
    },
  });
}

export function makeSensitivity(effectiveFrom: string, mouseDpi = 800, mouseSensitivity = 1, createdAt?: string) {
  return prisma.sensitivity.create({
    data: { effectiveFrom: new Date(effectiveFrom), mouseDpi, mouseSensitivity, ...(createdAt && { createdAt: new Date(createdAt) }) },
  });
}
