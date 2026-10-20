import { z } from "zod";

// Une chaîne vide serait convertie en 0 par z.coerce, et `formData.get` renvoie null pour un champ absent :
// dans les deux cas on veut « valeur non renseignée ».
export const emptyToUndefined = (value: unknown) =>
  value === "" || value === null || (typeof value === "string" && value.trim() === "") ? undefined : value;

/**
 * Identifiant généré par Prisma (`cuid(2)`, 24 caractères ; les anciens cuid v1 en font 25). `z.cuid2` a une regex
 * permissive (minuscules et chiffres, sans limite de longueur) : on borne la longueur pour refuser les entrées démesurées.
 */
export const entityId = (message: string) => z.cuid2({ error: message }).max(32, message);
