import { z } from "zod";
import { WEAPONS, type Weapon } from "@/config/apex-weapons.config";

// La config reste la source de vérité : ici seulement ce qu'elle ne fournit pas (enum de slugs, alias).
export const WEAPON_SLUGS = WEAPONS.map((weapon) => weapon.slug) as [string, ...string[]];

export const WeaponSlugSchema = z.enum(WEAPON_SLUGS, {
  error: "Arme inconnue",
});

export type WeaponSlug = z.infer<typeof WeaponSlugSchema>;

// "R-99", "r99", "L-STAR", "Triple  Take" → "r99", "r99", "lstar", "tripletake"
export function normalizeWeaponName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Alias stockés en base (colonne `aliases`) : nom d'origine, minuscules, forme normalisée et slug
export function getWeaponAliases({ name, slug }: Weapon) {
  return [...new Set([name, name.toLowerCase(), normalizeWeaponName(name), slug])];
}

const SLUG_BY_ALIAS = new Map<string, string>(
  WEAPONS.flatMap((weapon) =>
    [weapon.name, weapon.slug].map((alias) => [normalizeWeaponName(alias), weapon.slug] as const),
  ),
);

export function resolveWeaponSlug(name: string): string | undefined {
  return SLUG_BY_ALIAS.get(normalizeWeaponName(name));
}

