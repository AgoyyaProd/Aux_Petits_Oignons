import { z } from "zod";

const email = z
  .string({ error: "Adresse e-mail requise." })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Adresse e-mail invalide." }));

// Aligné sur supabase/config.toml : 8 caractères minimum, lettres et chiffres.
const password = z
  .string({ error: "Mot de passe requis." })
  .min(8, { error: "8 caractères minimum." })
  .max(72, { error: "72 caractères maximum." })
  .regex(/[A-Za-z]/, { error: "Le mot de passe doit contenir au moins une lettre." })
  .regex(/\d/, { error: "Le mot de passe doit contenir au moins un chiffre." });

export const signInSchema = z.object({
  email,
  password: z.string({ error: "Mot de passe requis." }).min(1, { error: "Mot de passe requis." }),
  next: z.string().optional(),
});

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(80, { error: "80 caractères maximum." })
    .optional()
    .transform((v) => (v ? v : undefined)),
  email,
  password,
  next: z.string().optional(),
});

export const magicLinkSchema = z.object({
  email,
  next: z.string().optional(),
});

/** État renvoyé par les actions au formulaire (useActionState). */
export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "displayName", string>>;
  /** Valeurs à réafficher après une erreur (jamais le mot de passe). */
  values?: { email?: string; displayName?: string };
};

export const idleState: AuthFormState = { status: "idle" };

/** Convertit une erreur Zod en erreurs par champ (premier message de chaque champ). */
export function toFieldErrors(error: z.ZodError): AuthFormState["fieldErrors"] {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key] = issue.message;
  }
  return out;
}
