import { z } from "zod";
import { emptyToUndefined } from "./shared";
import { resolveWeaponSlug } from "./weapon";

/** Écart toléré entre la précision fournie et `shotsHit / totalShots` (en points de %). */
export const ACCURACY_TOLERANCE = 0.5;

function intField(label: string, min = 0) {
  return z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: `${label} : doit être un nombre` })
      .int(`${label} : doit être un entier`)
      .min(min, min === 0 ? `${label} : ne peut pas être négatif` : `${label} : doit être supérieur à 0`),
  );
}

// Accepte 45.2, "45.2", "45,2" et "45.2%"
const accuracyField = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const cleaned = value.trim().replace(/%$/, "").replace(",", ".").trim();
    return cleaned === "" ? undefined : cleaned;
  },
  z.coerce
    .number({ error: "La précision doit être un nombre (ex. 45.2 ou 45.2%)" })
    .min(0, "La précision ne peut pas être négative")
    .max(100, "La précision ne peut pas dépasser 100 %"),
);

const weaponField = z
  .string({ error: "L'arme est requise" })
  .trim()
  .min(1, "L'arme est requise")
  .transform((name, ctx) => {
    const slug = resolveWeaponSlug(name);
    if (!slug) {
      ctx.issues.push({ code: "custom", message: `Arme inconnue : « ${name} »`, input: name });
      return z.NEVER;
    }
    return slug;
  });

const BaseChallengeSchema = z.object({
  challengeName: z
    .string({ error: "Le nom du challenge est requis" })
    .trim()
    .min(1, "Le nom du challenge est requis")
    .max(100, "Le nom du challenge est trop long (100 caractères max)"),
  weapon: weaponField,
  shotsHit: intField("Tirs touchés"),
  totalShots: intField("Tirs totaux"),
  criticalShots: intField("Tirs critiques"),
  kills: intField("Kills"),
  damage: intField("Dégâts"),
  accuracy: accuracyField,
  roundtime: intField("Durée", 1),
});

type ChallengeFields = z.output<typeof BaseChallengeSchema>;

function expectedAccuracy({ shotsHit, totalShots }: Pick<ChallengeFields, "shotsHit" | "totalShots">) {
  return totalShots === 0 ? 0 : (shotsHit / totalShots) * 100;
}

function checkConsistency(data: ChallengeFields, ctx: z.RefinementCtx) {
  if (data.shotsHit > data.totalShots) {
    ctx.addIssue({
      code: "custom",
      path: ["shotsHit"],
      message: "Les tirs touchés ne peuvent pas dépasser les tirs totaux",
    });
  }
  if (data.criticalShots > data.shotsHit) {
    ctx.addIssue({
      code: "custom",
      path: ["criticalShots"],
      message: "Les tirs critiques ne peuvent pas dépasser les tirs touchés",
    });
  }
  const expected = expectedAccuracy(data);
  if (Math.abs(data.accuracy - expected) > ACCURACY_TOLERANCE) {
    ctx.addIssue({
      code: "custom",
      path: ["accuracy"],
      message: `La précision (${data.accuracy} %) ne correspond pas à ${data.shotsHit}/${data.totalShots} (${expected.toFixed(1)} %)`,
    });
  }
}

// La précision stockée est recalculée depuis les tirs : la valeur fournie ne sert qu'à détecter une incohérence
function toRecord({ weapon, ...rest }: ChallengeFields) {
  return {
    ...rest,
    weaponId: weapon,
    accuracy: Math.round(expectedAccuracy(rest) * 100) / 100,
  };
}

/** Une ligne d'export R5Reloaded (sans date : elle vient du formulaire d'import). */
export const ChallengeSchema = BaseChallengeSchema.superRefine(checkConsistency).transform(toRecord);

/** Saisie manuelle : même règles + date de la session. */
export const ManualChallengeSchema = BaseChallengeSchema.extend({
  playedAt: z.coerce
    .date({ error: "La date de la session est invalide" })
    .refine((date) => date <= new Date(), "La date de la session ne peut pas être dans le futur"),
})
  .superRefine(checkConsistency)
  .transform(({ playedAt, ...fields }) => ({ ...toRecord(fields), playedAt }));

export type ChallengeInput = z.input<typeof ChallengeSchema>;
export type ChallengeData = z.output<typeof ChallengeSchema>;
export type ManualChallengeInput = z.input<typeof ManualChallengeSchema>;
export type ManualChallengeData = z.output<typeof ManualChallengeSchema>;

/** Suppression d'un challenge saisi à la main (id généré par Prisma, cf. `DeleteImportSchema`). */
export const DeleteChallengeSchema = z.object(
  { id: z.cuid2({ error: "Identifiant de challenge invalide" }) },
  { error: "Requête invalide" },
);
