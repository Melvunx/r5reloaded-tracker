"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_WEAPONS_LABEL, WEAPON_TYPE, WEAPONS } from "@/config/apex-weapons.config";
import { cn } from "@/lib/utils";
import { DEFAULT_RANGE, RANGE_LABELS, RANGES, type ChartFilters as Filters } from "@/schema/filters";

type Props = { filters: Filters; challengeNames: string[] };

/** URL du dashboard pour un jeu de filtres ; les valeurs par défaut sont omises pour garder une URL propre. */
function filtersHref(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.range !== DEFAULT_RANGE) params.set("range", filters.range);
  if (filters.weapon) params.set("weapon", filters.weapon);
  if (filters.weaponType) params.set("weaponType", filters.weaponType);
  if (filters.challenge) params.set("challenge", filters.challenge);
  const query = params.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

const WEAPON_ITEMS = [
  { value: null, label: ALL_WEAPONS_LABEL },
  ...WEAPONS.map((weapon) => ({ value: weapon.slug, label: weapon.name })),
];
const TYPE_ITEMS = [
  { value: null, label: "Toutes les catégories" },
  ...Object.entries(WEAPON_TYPE).map(([value, label]) => ({ value, label })),
];

export function ChartFilters({ filters, challengeNames }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(next: Partial<Filters>) {
    startTransition(() => router.replace(filtersHref({ ...filters, ...next }), { scroll: false }));
  }

  const challengeItems = [
    { value: null, label: "Tous les challenges" },
    ...challengeNames.map((name) => ({ value: name, label: name })),
  ];

  return (
    <div className={cn("flex flex-col gap-4", isPending && "opacity-70")}>
      <div className="flex flex-wrap gap-1">
        {RANGES.map((range) => (
          <Link
            key={range}
            href={filtersHref({ ...filters, range })}
            replace
            scroll={false}
            aria-current={filters.range === range ? "true" : undefined}
            className={buttonVariants({ variant: filters.range === range ? "secondary" : "ghost" })}
          >
            {RANGE_LABELS[range]}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        <Field className="w-52">
          <FieldLabel>Arme</FieldLabel>
          {/* Arme et catégorie sont exclusives : choisir l'une efface l'autre */}
          <Select
            items={WEAPON_ITEMS}
            value={filters.weapon ?? null}
            onValueChange={(value) => update({ weapon: value ?? undefined, weaponType: undefined })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEAPON_ITEMS.map((item) => (
                <SelectItem key={item.value ?? "all"} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field className="w-52">
          <FieldLabel>Catégorie</FieldLabel>
          <Select
            items={TYPE_ITEMS}
            value={filters.weaponType ?? null}
            onValueChange={(value) =>
              update({ weaponType: (value as Filters["weaponType"]) ?? undefined, weapon: undefined })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_ITEMS.map((item) => (
                <SelectItem key={item.value ?? "all"} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field className="w-52">
          <FieldLabel>Challenge</FieldLabel>
          <Select
            items={challengeItems}
            value={filters.challenge ?? null}
            onValueChange={(value) => update({ challenge: value ?? undefined })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {challengeItems.map((item) => (
                <SelectItem key={item.value ?? "all"} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}
