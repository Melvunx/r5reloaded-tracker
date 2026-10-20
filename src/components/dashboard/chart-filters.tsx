"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WeaponOption } from "@/components/weapon-option";
import { ALL_WEAPONS_LABEL, WEAPON_TYPE, WEAPONS, WEAPONS_BY_TYPE, getWeaponBySlug, type Weapon, type WeaponType } from "@/config/apex-weapons.config";
import { favoriteKind, type Favorites } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { DEFAULT_RANGE, RANGE_LABELS, RANGES, type ChartFilters as Filters } from "@/schema/filters";

type Props = { filters: Filters; challengeNames: string[]; favorites: Favorites };

/** URL du dashboard pour un jeu de filtres ; les valeurs par défaut sont omises pour garder une URL propre. */
function filtersHref(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.range !== DEFAULT_RANGE) params.set("range", filters.range);
  if (filters.weapon) params.set("weapon", filters.weapon);
  if (filters.weaponType) params.set("weaponType", filters.weaponType);
  if (filters.challenge) params.set("challenge", filters.challenge);
  if (filters.compare) params.set("compare", filters.compare);
  const query = params.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

const NO_COMPARE_LABEL = "Aucune comparaison";

const TYPE_ITEMS = [
  { value: null, label: "Toutes les catégories" },
  ...Object.entries(WEAPON_TYPE).map(([value, label]) => ({ value, label })),
];

export function ChartFilters({ filters, challengeNames, favorites }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(next: Partial<Filters>) {
    startTransition(() => router.replace(filtersHref({ ...filters, ...next }), { scroll: false }));
  }

  // Chaque arme s'affiche avec son image, et avec son effet si c'est une favorite (préférée ou de sa catégorie)
  const weaponLabel = (weapon: Weapon) => (
    <WeaponOption weapon={weapon} favorite={favoriteKind(favorites, weapon.slug, weapon.type)} />
  );
  const weaponItems = [
    { value: null, label: ALL_WEAPONS_LABEL },
    ...WEAPONS.map((weapon) => ({ value: weapon.slug, label: weaponLabel(weapon) })),
  ];

  // Comparaison : les armes de la même catégorie d'abord (c'est là qu'elle a le plus de sens), puis les autres
  const currentWeapon = filters.weapon ? getWeaponBySlug(filters.weapon) : undefined;
  const others = WEAPONS.filter((weapon) => weapon.slug !== currentWeapon?.slug);
  const compareGroups = currentWeapon
    ? [
        { label: `Même catégorie (${WEAPON_TYPE[currentWeapon.type]})`, weapons: others.filter((w) => w.type === currentWeapon.type) },
        { label: "Autres armes", weapons: others.filter((w) => w.type !== currentWeapon.type) },
      ].filter((group) => group.weapons.length > 0)
    : [];
  const compareItems = [
    { value: null, label: NO_COMPARE_LABEL },
    ...others.map((weapon) => ({ value: weapon.slug, label: weaponLabel(weapon) })),
  ];

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
        <Field className="w-72">
          <FieldLabel>Arme</FieldLabel>
          {/* Arme et catégorie sont exclusives : choisir l'une efface l'autre */}
          <Select
            items={weaponItems}
            value={filters.weapon ?? null}
            onValueChange={(value) =>
              update({ weapon: value ?? undefined, weaponType: undefined, compare: value ? filters.compare : undefined })
            }
          >
            <SelectTrigger className="w-full text-base data-[size=default]:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>
                <span className="text-base">{ALL_WEAPONS_LABEL}</span>
              </SelectItem>
              {(Object.keys(WEAPONS_BY_TYPE) as WeaponType[]).map((type) => (
                <SelectGroup key={type}>
                  <SelectLabel className="text-sm font-medium">{WEAPON_TYPE[type]}</SelectLabel>
                  {WEAPONS_BY_TYPE[type].map((weapon) => (
                    <SelectItem key={weapon.slug} value={weapon.slug}>
                      {weaponLabel(weapon)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {filters.weapon && (
          <Field className="w-72">
            <FieldLabel>Comparer avec</FieldLabel>
            <Select
              items={compareItems}
              value={filters.compare ?? null}
              onValueChange={(value) => update({ compare: value ?? undefined })}
            >
              <SelectTrigger className="w-full text-base data-[size=default]:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>
                  <span className="text-base">{NO_COMPARE_LABEL}</span>
                </SelectItem>
                {compareGroups.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel className="text-sm font-medium">{group.label}</SelectLabel>
                    {group.weapons.map((weapon) => (
                      <SelectItem key={weapon.slug} value={weapon.slug}>
                        {weaponLabel(weapon)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field className="w-52">
          <FieldLabel>Catégorie</FieldLabel>
          <Select
            items={TYPE_ITEMS}
            value={filters.weaponType ?? null}
            onValueChange={(value) =>
              update({ weaponType: (value as Filters["weaponType"]) ?? undefined, weapon: undefined, compare: undefined })
            }
          >
            <SelectTrigger className="w-full text-base data-[size=default]:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_ITEMS.map((item) => (
                <SelectItem key={item.value ?? "all"} value={item.value} className="text-base">
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
            <SelectTrigger className="w-full text-base data-[size=default]:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {challengeItems.map((item) => (
                <SelectItem key={item.value ?? "all"} value={item.value} className="text-base">
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
