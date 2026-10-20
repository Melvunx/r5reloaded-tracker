import Image from "next/image";
import { getWeaponBadgePath, getWeaponImagePath, type WeaponType } from "@/config/apex-weapons.config";

/** Échelle appliquée à toutes les images d'armes de l'application : un seul réglage pour les agrandir ou les réduire. */
export const WEAPON_IMAGE_SCALE = 1.5;

type Props = {
  /** `type` n'est requis que pour le visuel de l'arme (le chemin de l'image en dépend), pas pour le badge. */
  weapon: { slug: string; type?: WeaponType };
  /** « image » = visuel de l'arme (large), « badge » = pastille carrée. */
  variant?: "image" | "badge";
  /** Taille de base en px avant mise à l'échelle. */
  base?: { width: number; height: number };
};

const DEFAULT_BASE = { image: { width: 40, height: 20 }, badge: { width: 24, height: 24 } } as const;

export function WeaponImage({ weapon, variant = "image", base = DEFAULT_BASE[variant] }: Props) {
  const src =
    variant === "badge" ? getWeaponBadgePath(weapon.slug) : weapon.type ? getWeaponImagePath(weapon.type, weapon.slug) : null;
  if (!src) return null;
  const width = Math.round(base.width * WEAPON_IMAGE_SCALE);
  const height = Math.round(base.height * WEAPON_IMAGE_SCALE);

  return <Image src={src} alt="" width={width} height={height} style={{ width, height }} className="shrink-0 object-contain object-left" />;
}
