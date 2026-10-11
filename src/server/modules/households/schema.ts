import { z } from "zod";
import { parseEurosToCents } from "@/domain/money";

/** Matériel de cuisine connu (référentiel public.equipment, migration 0023). */
export const EQUIPMENT_CODES = [
  "plaques",
  "four",
  "poele",
  "casserole",
  "faitout",
  "plat_four",
  "plat_gratin",
  "moule",
  "mixeur",
  "micro_ondes",
  "airfryer",
] as const;

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

export const avoidedFoodSchema = z.object({
  householdId: z.uuid(),
  ingredient: z
    .string()
    .trim()
    .min(1, { error: "Choisis un aliment dans la liste." })
    .max(120, { error: "120 caractères maximum." }),
});

export const removeAvoidedFoodSchema = z.object({
  householdId: z.uuid(),
  ingredientId: z.uuid(),
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

// ---------------------------------------------------------------------------
// Membres et invitations
// ---------------------------------------------------------------------------

export const inviteSchema = z.object({
  householdId: z.uuid(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Adresse e-mail invalide." })),
});

export const memberSchema = z.object({
  householdId: z.uuid(),
  userId: z.uuid(),
});

export const invitationIdSchema = z.object({
  householdId: z.uuid(),
  invitationId: z.uuid(),
});

export const switchHouseholdSchema = z.object({ householdId: z.uuid() });

/** Jeton d'invitation : 32 octets aléatoires en hexadécimal (voir migration 0002). */
export const invitationTokenSchema = z.string().regex(/^[0-9a-f]{64}$/);

export type InviteState = FormState<"email"> & {
  /** Jeton clair, affiché une seule fois au propriétaire pour qu'il partage le lien. */
  token?: string;
  email?: string;
};

// ---------------------------------------------------------------------------
// Profil alimentaire (migration 0022)
// ---------------------------------------------------------------------------

export const EATING_STYLES = [
  { code: "omnivore", label: "Omnivore", hint: "Je mange de tout." },
  {
    code: "flexitarien",
    label: "Flexitarien",
    hint: "Surtout végétarien : au plus un plat sur trois avec de la viande.",
  },
  { code: "pescetarien", label: "Pescétarien", hint: "Du poisson, mais pas de viande." },
  { code: "vegetarien", label: "Végétarien", hint: "Ni viande ni poisson." },
  { code: "vegetalien", label: "Végétalien", hint: "Aucun produit d'origine animale." },
] as const;

export const OBJECTIVES = [
  {
    code: "manger_mieux",
    label: "Manger mieux",
    hint: "Plus de végétaux, de poisson et de légumineuses.",
  },
  {
    code: "plus_legumes",
    label: "Plus de légumes",
    hint: "Les plats riches en légumes passent devant.",
  },
  { code: "decouvrir", label: "Découvrir des plats", hint: "Des recettes jamais mises au menu." },
  {
    code: "moins_gaspiller",
    label: "Moins gaspiller",
    hint: "Ce qui est à finir et ton stock d'abord.",
  },
  {
    code: "economiser",
    label: "Faire des économies",
    hint: "Les plats les moins chers par portion.",
  },
  { code: "rapide", label: "Cuisiner plus vite", hint: "Des plats prêts en 30 minutes." },
] as const;

export const foodProfileSchema = z.object({
  householdId: z.uuid(),
  style: z.enum(["omnivore", "flexitarien", "pescetarien", "vegetarien", "vegetalien"]),
  noPork: z.boolean(),
  allergens: z.array(z.string().regex(/^[a-z_]+$/)).max(20),
  objectives: z
    .array(
      z.enum([
        "manger_mieux",
        "plus_legumes",
        "decouvrir",
        "moins_gaspiller",
        "economiser",
        "rapide",
      ]),
    )
    .max(6),
  equipment: z.array(z.enum(EQUIPMENT_CODES)).max(EQUIPMENT_CODES.length),
});
