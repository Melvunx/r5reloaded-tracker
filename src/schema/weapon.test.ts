import { describe, expect, it } from "vitest";
import { WEAPONS } from "@/config/apex-weapons.config";
import {
  WEAPON_SLUGS,
  WeaponSlugSchema,
  getWeaponAliases,
  normalizeWeaponName,
  resolveWeaponSlug,
} from "./weapon";

describe("resolveWeaponSlug", () => {
  it.each([
    ["R-99", "r99"],
    ["r99", "r99"],
    ["r-99", "r99"],
    ["  R-99  ", "r99"],
    ["L-STAR", "lstar"],
    ["Triple Take", "tripletake"],
    ["G7 Scout", "g7"],
    ["g7", "g7"],
    ["EVA-8", "eva8"],
  ])("résout %j vers %s", (name, slug) => {
    expect(resolveWeaponSlug(name)).toBe(slug);
  });

  it("renvoie undefined pour une arme inconnue", () => {
    expect(resolveWeaponSlug("Bocek")).toBeUndefined();
    expect(resolveWeaponSlug("")).toBeUndefined();
  });

  it("résout le nom de chaque arme de la config", () => {
    for (const weapon of WEAPONS) {
      expect(resolveWeaponSlug(weapon.name)).toBe(weapon.slug);
    }
  });
});

describe("normalizeWeaponName", () => {
  it("retire casse, tirets et espaces", () => {
    expect(normalizeWeaponName("Charge Rifle")).toBe("chargerifle");
  });
});

describe("getWeaponAliases", () => {
  it("contient le nom, la forme minuscule, la forme normalisée et le slug sans doublon", () => {
    expect(getWeaponAliases({ name: "R-99", slug: "r99", type: "SMG" })).toEqual(["R-99", "r-99", "r99"]);
  });
});

describe("WeaponSlugSchema", () => {
  it("accepte un slug connu et rejette le reste", () => {
    expect(WEAPON_SLUGS).toHaveLength(WEAPONS.length);
    expect(WeaponSlugSchema.safeParse("r99").success).toBe(true);
    expect(WeaponSlugSchema.safeParse("R-99").success).toBe(false);
  });
});
