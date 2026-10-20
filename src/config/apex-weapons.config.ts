import { z } from "zod";
import { slugSchema, weaponNameSchema } from "./utils.config";

export const WEAPON_TYPE = {
  PISTOL: "Pistolet",
  SHOTGUN: "Fusil à pompe",
  SMG: "Mitraillette",
  LMG: "Mitrailleuse",
  AR: "Fusil d'assaut",
  SNIPER: "Fusil de précision",
  MARKSMAN: "Armes à longue portée",
} as const;

export const WeaponTypeSchema = z.enum([
  "PISTOL",
  "SHOTGUN",
  "SMG",
  "LMG",
  "AR",
  "SNIPER",
  "MARKSMAN",
]);

export type WeaponType = z.infer<typeof WeaponTypeSchema>;

export const WeaponSchema = z.object({
  name: weaponNameSchema,
  slug: slugSchema, // utilisé pour les paths d'images
  type: WeaponTypeSchema,
});

export type Weapon = z.infer<typeof WeaponSchema>;

export const ALL_WEAPONS_LABEL = "Toutes les armes";

// --- Données brutes ---
const RAW_WEAPONS = [
  // PISTOLS
  { name: "Wingman", slug: "wingman", type: "PISTOL" },
  { name: "RE-45", slug: "re45", type: "PISTOL" },
  { name: "P2020", slug: "p2020", type: "PISTOL" },

  // SMGS
  { name: "R-99", slug: "r99", type: "SMG" },
  { name: "Volt", slug: "volt", type: "SMG" },
  { name: "Alternator", slug: "alternator", type: "SMG" },
  { name: "Prowler", slug: "prowler", type: "SMG" },

  // ARS
  { name: "R-301", slug: "r301", type: "AR" },
  { name: "Flatline", slug: "flatline", type: "AR" },
  { name: "Havoc", slug: "havoc", type: "AR" },
  { name: "Hemlok", slug: "hemlok", type: "AR" },

  // LMGS
  { name: "Devotion", slug: "devotion", type: "LMG" },
  { name: "L-Star", slug: "lstar", type: "LMG" },
  { name: "Spitfire", slug: "spitfire", type: "LMG" },

  // MARKSMANS
  { name: "G7 Scout", slug: "g7", type: "MARKSMAN" },
  { name: "Triple Take", slug: "tripletake", type: "MARKSMAN" },

  //SNIPERS
  { name: "Charge Rifle", slug: "chargerifle", type: "SNIPER" },
  { name: "Kraber", slug: "kraber", type: "SNIPER" },
  { name: "Longbow", slug: "longbow", type: "SNIPER" },
  { name: "Sentinel", slug: "sentinel", type: "SNIPER" },

  //SHOTGUNS
  { name: "EVA-8", slug: "eva8", type: "SHOTGUN" },
  { name: "Mastiff", slug: "mastiff", type: "SHOTGUN" },
  { name: "Mozambique", slug: "mozambique", type: "SHOTGUN" },
  { name: "Peacekeeper", slug: "peacekeeper", type: "SHOTGUN" },
] satisfies z.input<typeof WeaponSchema>[];

export const WEAPONS = z.array(WeaponSchema).parse(RAW_WEAPONS);

// Armes groupées par type
export const WEAPONS_BY_TYPE = WEAPONS.reduce(
  (acc, weapon) => {
    acc[weapon.type].push(weapon);
    return acc;
  },
  Object.fromEntries(
    WeaponTypeSchema.options.map((type) => [type, []]),
  ) as unknown as Record<WeaponType, Weapon[]>,
);

export const ChallengeStatSchema = z.object({
  average: z.object({
    accuracy: z.number(),
    damage: z.number(),
    kills: z.number(),
  }),
  totalGamePlayed: z.number(),
  maxAccuracy: z.number(),
  minAccuracy: z.number(),
});

export type ChallengeStat = z.infer<typeof ChallengeStatSchema>;

export const WeaponStatSchema = z.object({
  weapon: WeaponSchema,
  challengePlayed: z.number(),
  average: z.object({
    accuracy: z.number(),
    damage: z.number(),
    kills: z.number(),
    shotsHit: z.number(),
  }),
});

export type WeaponStat = z.infer<typeof WeaponStatSchema>;

// --- Helpers ---
export function getWeaponsByType(type: WeaponType) {
  return WEAPONS.filter((w) => w.type === type);
}

// undefined si l'arme est inconnue : à l'appelant de gérer l'erreur (cf. alias à l'import)
export function getWeaponByName(name: string): Weapon | undefined {
  return WEAPONS.find((w) => w.name === name);
}

export function getWeaponBySlug(slug: string): Weapon | undefined {
  return WEAPONS.find((w) => w.slug === slug);
}

export function getWeaponImagePath(type: WeaponType, slug: string) {
  return `/apex-weapons/${type.toLowerCase()}/${slug}.png`;
}

export function getWeaponBadgePath(slug: string) {
  return `/apex-weapons/badges/${slug}.webp`;
}

export function getImagePathByWeaponName(weaponName: string) {
  const weapon = getWeaponByName(weaponName);
  return weapon ? getWeaponImagePath(weapon.type, weapon.slug) : undefined;
}

export function defaultWeaponStats(weapon: Weapon): WeaponStat {
  return {
    weapon,
    challengePlayed: 0,
    average: {
      accuracy: 0,
      damage: 0,
      kills: 0,
      shotsHit: 0,
    },
  };
}
