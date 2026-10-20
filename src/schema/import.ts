import { z } from "zod";
import { getExportDate } from "@/lib/export-date";
import { ChallengeSchema, type ChallengeData } from "./challenge";

/** En-têtes exacts attendus sur la 2e ligne d'un export R5Reloaded. */
export const R5_HEADERS = [
  "ChallengeName",
  "ShotsHit",
  "Kills",
  "Weapon",
  "Accuracy",
  "Damage",
  "CriticalShots",
  "TotalShots",
  "Roundtime",
] as const;

export const R5_HEADER_LINE = R5_HEADERS.join(",");

export const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024;

const column = (name: string) => z.string({ error: `La colonne ${name} est manquante` });

// Une ligne brute du CSV (clés = en-têtes) vers les champs de ChallengeSchema
const ImportRowSchema = z
  .object(Object.fromEntries(R5_HEADERS.map((header) => [header, column(header)])) as Record<
    (typeof R5_HEADERS)[number],
    z.ZodString
  >)
  .transform((row) => ({
    challengeName: row.ChallengeName,
    shotsHit: row.ShotsHit,
    kills: row.Kills,
    weapon: row.Weapon,
    accuracy: row.Accuracy,
    damage: row.Damage,
    criticalShots: row.CriticalShots,
    totalShots: row.TotalShots,
    roundtime: row.Roundtime,
  }));

export type ImportLineResult =
  | { success: true; lineNumber: number; data: ChallengeData }
  | { success: false; lineNumber: number; errors: string[] };

/** Valide une ligne du fichier ; les erreurs sont préfixées `Ligne N : …`. */
export function parseImportRow(lineNumber: number, row: unknown): ImportLineResult {
  const columns = ImportRowSchema.safeParse(row);
  const result = columns.success ? ChallengeSchema.safeParse(columns.data) : columns;
  if (result.success) return { success: true, lineNumber, data: result.data };
  return {
    success: false,
    lineNumber,
    errors: result.error.issues.map((issue) => `Ligne ${lineNumber} : ${issue.message}`),
  };
}

// Un champ vide (`""`) ou absent (`formData.get` renvoie null) vaut « non renseigné » : sans ça, coerce.date(null) donne 1970
const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

/**
 * Formulaire d'import : le fichier `.txt` et la date de la session. Sans date saisie, on prend celle de l'export
 * (timestamp du nom du fichier), à défaut aujourd'hui.
 */
export const ImportFormSchema = z.object({
  file: z
    .instanceof(File, { error: "Aucun fichier sélectionné" })
    .refine((file) => file.name.toLowerCase().endsWith(".txt"), "Le fichier doit être un .txt")
    .refine((file) => file.size > 0, "Le fichier est vide")
    .refine(
      (file) => file.size <= MAX_IMPORT_FILE_SIZE,
      "Le fichier est trop volumineux (5 Mo max)",
    ),
  playedAt: z.preprocess(
    emptyToUndefined,
    z.coerce
      .date({ error: "La date de la session est invalide" })
      .refine((date) => date <= new Date(), "La date de la session ne peut pas être dans le futur")
      .optional(),
  ),
}).transform(({ file, playedAt }) => ({
  file,
  playedAt: playedAt ?? getExportDate(file.name) ?? new Date(),
}));

export type ImportFormInput = z.input<typeof ImportFormSchema>;
export type ImportFormData = z.output<typeof ImportFormSchema>;

/**
 * Annulation d'un import : l'id est un cuid généré par Prisma, pas un uuid. `z.cuid2` (cuid v1 est déprécié) a une regex
 * permissive qui accepte aussi les ids v1 produits par `@default(cuid())`.
 */
export const DeleteImportSchema = z.object(
  { id: z.cuid2({ error: "Identifiant d'import invalide" }) },
  { error: "Requête invalide" },
);
