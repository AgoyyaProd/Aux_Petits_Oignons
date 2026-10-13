import { z } from "zod";
import { parseEurosToCents } from "@/domain/money";
import { isMonday } from "@/lib/week";

const week = z.string().refine(isMonday, { error: "Semaine invalide." });
/**
 * Version vue par l'utilisateur : « d3 » (brouillon, révision 3), « p2 » (menu validé,
 * version 2), ou vide (aucun menu). Sert à détecter une modification concurrente.
 */
const version = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^[dp][1-9]\d{0,8}$/.test(v), { error: "Version invalide." });
const key = z.uuid({ error: "Formulaire expiré, recharge la page." });

const intIn = (min: number, max: number, message: string) =>
  z.coerce
    .number({ error: message })
    .int({ error: message })
    .min(min, { error: message })
    .max(max, { error: message });

export const generateSchema = z.object({
  week,
  version,
  key,
  mealCount: intIn(1, 21, "Entre 1 et 21 repas."),
  people: intIn(1, 20, "Entre 1 et 20 personnes."),
  budget: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      try {
        const cents = parseEurosToCents(v);
        if (cents > 10_000_000) throw new Error();
        return cents;
      } catch {
        ctx.addIssue({ code: "custom", message: "Budget invalide (exemple : 60 ou 60,50)." });
        return z.NEVER;
      }
    }),
});

export type GenerateField = "mealCount" | "people" | "budget";

export const planActionSchema = z.object({ week, version, key });

export const entrySchema = planActionSchema.extend({
  position: intIn(1, 21, "Plat invalide."),
});

export const servingsSchema = entrySchema.extend({
  servings: intIn(1, 40, "Entre 1 et 40 portions."),
});

export const replaceSchema = entrySchema.extend({ recipeId: z.uuid() });

/** Case du planning « AAAA-MM-JJ:lunch|dinner », ou vide pour « non placé ». */
export const slotSchema = entrySchema.extend({
  slot: z.string().regex(/^(\d{4}-\d{2}-\d{2}:(lunch|dinner))?$/, { error: "Jour invalide." }),
});

export type PlannerState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<GenerateField, string>>;
};

export const idlePlanner: PlannerState = { status: "idle" };
