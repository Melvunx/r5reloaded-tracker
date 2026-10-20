import { APEX_YAW, CM_PER_INCH } from "@/config/mouse.config";

/** eDPI = DPI × sensibilité en jeu : permet de comparer deux réglages quel que soit le DPI. */
export function edpi(dpi: number, sensitivity: number) {
  return dpi * sensitivity;
}

/** Distance de souris (en cm) pour tourner de 360° : 360 / (DPI × sensibilité × yaw) pouces, convertis en cm. */
export function cmPer360(dpi: number, sensitivity: number, yaw = APEX_YAW) {
  return (360 / (dpi * sensitivity * yaw)) * CM_PER_INCH;
}

type Dated = { effectiveFrom: Date; createdAt: Date };

/**
 * Réglage actif à une date : le plus récent dont `effectiveFrom` <= date (à égalité, le dernier créé).
 * Même règle que la requête Prisma de `getSensitivityAt`, pour lier un challenge à ses réglages sans clé étrangère.
 */
export function pickActive<T extends Dated>(settings: readonly T[], at: Date): T | undefined {
  return settings
    .filter((setting) => setting.effectiveFrom <= at)
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime() || b.createdAt.getTime() - a.createdAt.getTime())[0];
}
