import { WeaponImage } from "@/components/weapon-image";
import type { Weapon } from "@/config/apex-weapons.config";
import type { FavoriteKind } from "@/lib/stats";

/**
 * Arme dans une liste déroulante : image à gauche du nom. Une arme favorite reçoit les attributs lus par les effets
 * de `globals.css` (`[data-favorite]`), les mêmes que dans le tableau des stats.
 */
export function WeaponOption({ weapon, favorite }: { weapon: Weapon; favorite?: FavoriteKind | null }) {
  return (
    <span className="flex items-center gap-3 text-base" data-favorite={favorite ?? undefined} data-type={weapon.type}>
      <WeaponImage weapon={weapon} />
      <span className="weapon-name">{weapon.name}</span>
    </span>
  );
}
