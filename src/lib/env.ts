import { z } from "zod"

const EnvSchema = z.object({
  DATABASE_URL: z.url({ message: "DATABASE_URL doit être une URL valide" }),
  VERIF_LINE: z.string().min(1, { message: "VERIF_LINE ne doit pas être vide" }),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("Variables d'environnement invalides :", z.flattenError(parsed.error).fieldErrors)
  throw new Error("Variables d'environnement invalides (voir .env.example)")
}

export const env = parsed.data
