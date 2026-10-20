"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { createManualChallenge, deleteManualChallenge } from "@/lib/challenge-service";
import { DeleteChallengeSchema, ManualChallengeSchema } from "@/schema/challenge";

function revalidate() {
  revalidatePath("/manual-entry");
  revalidatePath("/dashboard");
}

/** Saisie manuelle d'un challenge : mêmes règles de validation que l'import, plus la date de la session. */
export async function addManualChallenge(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = ManualChallengeSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues.map((issue) => issue.message).join(" ; ") };

  try {
    const { id } = await createManualChallenge(parsed.data);
    revalidate();
    return { success: true, data: { id } };
  } catch (error) {
    console.error("addManualChallenge", error);
    return { success: false, error: "Erreur serveur pendant l'enregistrement du challenge" };
  }
}

export async function removeManualChallenge(input: unknown): Promise<ActionResult<null>> {
  const parsed = DeleteChallengeSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    if (!(await deleteManualChallenge(parsed.data.id))) return { success: false, error: "Cette saisie n'existe plus" };
    revalidate();
    return { success: true, data: null };
  } catch (error) {
    console.error("removeManualChallenge", error);
    return { success: false, error: "Erreur serveur pendant la suppression de la saisie" };
  }
}
