"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { createManualChallenge } from "@/lib/challenge-service";
import { ManualChallengeSchema } from "@/schema/challenge";

/** Saisie manuelle d'un challenge : mêmes règles de validation que l'import, plus la date de la session. */
export async function addManualChallenge(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = ManualChallengeSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues.map((issue) => issue.message).join(" ; ") };

  try {
    const { id } = await createManualChallenge(parsed.data);
    revalidatePath("/dashboard");
    return { success: true, data: { id } };
  } catch (error) {
    console.error("addManualChallenge", error);
    return { success: false, error: "Erreur serveur pendant l'enregistrement du challenge" };
  }
}
