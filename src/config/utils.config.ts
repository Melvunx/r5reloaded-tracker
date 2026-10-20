import z from "zod";

// --- Schémas de validation ---

export const weaponNameSchema = z.string().min(1);
export const slugSchema = z.string().min(1);
