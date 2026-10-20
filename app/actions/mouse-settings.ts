"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { createSensitivity, deleteSensitivity } from "@/lib/sensitivity-service";
import { DeleteSensitivitySchema, SensitivityFormSchema } from "@/schema/mouse-settings";

function revalidate() {
  revalidatePath("/mouse-settings");
  revalidatePath("/dashboard");
}

/** Ajoute un réglage à l'historique (il devient actif à `effectiveFrom`, aujourd'hui par défaut). */
export async function saveSensitivity(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = SensitivityFormSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues.map((issue) => issue.message).join(" ; ") };

  try {
    const { id } = await createSensitivity(parsed.data);
    revalidate();
    return { success: true, data: { id } };
  } catch (error) {
    console.error("saveSensitivity", error);
    return { success: false, error: "Erreur serveur pendant l'enregistrement des réglages" };
  }
}

export async function removeSensitivity(input: unknown): Promise<ActionResult<null>> {
  const parsed = DeleteSensitivitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    if (!(await deleteSensitivity(parsed.data.id))) return { success: false, error: "Ce réglage n'existe plus" };
    revalidate();
    return { success: true, data: null };
  } catch (error) {
    console.error("removeSensitivity", error);
    return { success: false, error: "Erreur serveur pendant la suppression du réglage" };
  }
}
