import { z } from "zod";
import { WeaponTypeSchema } from "@/config/apex-weapons.config";
import { WeaponSlugSchema } from "./weapon";

export const RANGES = ["1d", "1w", "1m", "all"] as const;
export const DEFAULT_RANGE = "1w";

export const RANGE_LABELS = {
  "1d": "1 jour",
  "1w": "1 semaine",
  "1m": "1 mois",
  all: "Tout",
} as const satisfies Record<(typeof RANGES)[number], string>;

// .catch() : une valeur invalide dans l'URL retombe sur le défaut au lieu de faire planter la page
export const ChartFiltersSchema = z.object({
  weapon: WeaponSlugSchema.optional().catch(undefined),
  weaponType: WeaponTypeSchema.optional().catch(undefined),
  range: z.enum(RANGES).catch(DEFAULT_RANGE),
  challenge: z.string().trim().min(1).max(100).optional().catch(undefined),
  // Seconde arme à superposer à `weapon` dans le graphique
  compare: WeaponSlugSchema.optional().catch(undefined),
}).transform((filters) => ({
  ...filters,
  // Une comparaison n'a de sens qu'entre deux armes différentes
  compare: filters.weapon && filters.compare !== filters.weapon ? filters.compare : undefined,
}));

export type ChartFilters = z.output<typeof ChartFiltersSchema>;

type SearchParams = Record<string, string | string[] | undefined>;

/** Parse les `searchParams` Next.js (un paramètre répété donne un tableau : on garde le premier). */
export function parseChartFilters(searchParams: SearchParams): ChartFilters {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  return ChartFiltersSchema.parse({
    weapon: first(searchParams.weapon),
    weaponType: first(searchParams.weaponType),
    range: first(searchParams.range),
    challenge: first(searchParams.challenge),
    compare: first(searchParams.compare),
  });
}
