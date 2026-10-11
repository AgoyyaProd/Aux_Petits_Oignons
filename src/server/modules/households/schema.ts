import { z } from "zod";
import { parseEurosToCents } from "@/domain/money";

const optionalInt = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: `${label} : entre ${min} et ${max}.` });
        return z.NEVER;
      }
      return n;
    });

export const householdSettingsSchema = z.object({
  householdId: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, { error: "Donne un nom à ton foyer." })
    .max(80, { error: "80 caractères maximum." }),
  peopleCount: z.coerce
    .number({ error: "Nombre de personnes invalide." })
    .int({ error: "Nombre entier attendu." })
    .min(1, { error: "Au moins 1 personne." })
    .max(20, { error: "20 personnes maximum." }),
  weeklyBudget: z
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
        ctx.addIssue({ code: "custom", message: "Montant invalide (exemple : 85 ou 85,50)." });
        return z.NEVER;
      }
    }),
  maxPrepMinutes: optionalInt(5, 600, "Temps de préparation"),
});

export const preferencesSchema = z.object({
  householdId: z.uuid(),
  diets: z.array(z.string().regex(/^[a-z_]+$/)).max(10),
  allergens: z.array(z.string().regex(/^[a-z_]+$/)).max(20),
});

export type SettingsFieldName = "name" | "peopleCount" | "weeklyBudget" | "maxPrepMinutes";

export type FormState<F extends string = string> = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<F, string>>;
};

export const idleForm: FormState<never> = { status: "idle" };

export function firstErrors<F extends string>(error: z.ZodError): Partial<Record<F, string>> {
  const out: Partial<Record<F, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key as F] = issue.message;
  }
  return out;
}
