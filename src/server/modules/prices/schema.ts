import { z } from "zod";
import { parseEurosToCents } from "@/domain/money";

export const STORES = [
  "Leclerc",
  "Carrefour",
  "Auchan",
  "Intermarché",
  "Super U",
  "Lidl",
  "Aldi",
  "Monoprix",
  "Casino",
  "Franprix",
  "Grand Frais",
  "Biocoop",
] as const;

export const storeSchema = z.object({
  householdId: z.uuid(),
  store: z
    .string()
    .trim()
    .max(60, { error: "60 caractères maximum." })
    .transform((v) => (v === "" ? null : v)),
});

export const householdPriceSchema = z.object({
  householdId: z.uuid(),
  ingredientId: z.uuid(),
  dimension: z.enum(["mass", "volume", "count"]),
  price: z
    .string()
    .trim()
    .transform((v, ctx) => {
      try {
        const cents = parseEurosToCents(v);
        if (cents < 1 || cents > 999_999) throw new Error();
        return cents;
      } catch {
        ctx.addIssue({ code: "custom", message: "Prix invalide (exemple : 2,49)." });
        return z.NEVER;
      }
    }),
  sourceUrl: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || /^https:\/\/[^\s]+$/.test(v), {
      error: "Le lien doit commencer par https://",
    }),
});

export const removeHouseholdPriceSchema = z.object({
  householdId: z.uuid(),
  ingredientId: z.uuid(),
});

export type PriceField = "price" | "sourceUrl";

export type PriceFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<PriceField, string>>;
};
