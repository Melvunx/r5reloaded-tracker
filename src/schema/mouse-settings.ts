import { z } from "zod";
import { MOUSE_DPI_RANGE, MOUSE_SENSITIVITY_RANGE } from "@/config/mouse.config";
import { emptyToUndefined, entityId } from "./shared";

/** Nouveau réglage souris (formulaire). `effectiveFrom` vide = aujourd'hui. */
export const SensitivityFormSchema = z.object(
  {
    mouseDpi: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: "Le DPI doit être un nombre" })
        .int("Le DPI doit être un entier")
        .min(MOUSE_DPI_RANGE.min, `Le DPI doit être d'au moins ${MOUSE_DPI_RANGE.min}`)
        .max(MOUSE_DPI_RANGE.max, `Le DPI ne peut pas dépasser ${MOUSE_DPI_RANGE.max}`),
    ),
    mouseSensitivity: z.preprocess(
      (value) => emptyToUndefined(typeof value === "string" ? value.replace(",", ".") : value),
      z.coerce
        .number({ error: "La sensibilité doit être un nombre" })
        .min(MOUSE_SENSITIVITY_RANGE.min, `La sensibilité doit être d'au moins ${MOUSE_SENSITIVITY_RANGE.min}`)
        .max(MOUSE_SENSITIVITY_RANGE.max, `La sensibilité ne peut pas dépasser ${MOUSE_SENSITIVITY_RANGE.max}`),
    ),
    effectiveFrom: z.preprocess(
      emptyToUndefined,
      z.coerce
        .date({ error: "La date d'application est invalide" })
        .refine((date) => date <= new Date(), "La date d'application ne peut pas être dans le futur")
        .optional(),
    ),
  },
  { error: "Requête invalide" },
).transform(({ effectiveFrom, ...settings }) => ({ ...settings, effectiveFrom: effectiveFrom ?? new Date() }));

export type SensitivityFormInput = z.input<typeof SensitivityFormSchema>;
export type SensitivityFormData = z.output<typeof SensitivityFormSchema>;

export const DeleteSensitivitySchema = z.object(
  { id: entityId("Identifiant de réglage invalide") },
  { error: "Requête invalide" },
);
