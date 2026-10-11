import { z } from "zod";
import { InvalidQuantityError } from "@/domain/errors";
import { isUnitCode, parseAmount, type UnitCode } from "@/domain/units";

export const LOCATIONS = ["fridge", "freezer", "pantry"] as const;
export type Location = (typeof LOCATIONS)[number];

export const LOCATION_LABEL: Record<Location, string> = {
  fridge: "Réfrigérateur",
  freezer: "Congélateur",
  pantry: "Placard",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const unit = z
  .string()
  .refine(isUnitCode, { error: "Unité inconnue." })
  .transform((u) => u as UnitCode);

/**
 * Quantité saisie : renvoyée telle qu'exprimée dans son unité, sous forme de nombre
 * décimal exact (3 décimales max). La conversion vers l'unité de base est faite en base.
 */
const optionalAmount = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    try {
      const milli = parseAmount(v);
      if (milli === 0) throw new InvalidQuantityError("zéro");
      return milli / 1000;
    } catch {
      ctx.addIssue({ code: "custom", message: "Quantité invalide (exemple : 1,5)." });
      return z.NEVER;
    }
  });

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    if (!ISO_DATE.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) {
      ctx.addIssue({ code: "custom", message: "Date invalide." });
      return z.NEVER;
    }
    return v;
  });

const expiryKind = z.enum(["use_by", "best_before"]).optional();

export const addItemSchema = z
  .object({
    householdId: z.uuid(),
    idempotencyKey: z.uuid(),
    ingredient: z.string().trim().min(1, { error: "Choisis un ingrédient dans la liste." }).max(80),
    location: z.enum(LOCATIONS, { error: "Choisis un emplacement." }),
    quantity: optionalAmount,
    unit,
    expiresOn: optionalDate,
    expiryKind,
    opened: z
      .string()
      .optional()
      .transform((v) => v === "on"),
    note: z.string().trim().max(280).optional(),
  })
  .transform((v) => ({ ...v, expiryKind: v.expiresOn ? (v.expiryKind ?? "use_by") : null }));

export const MOVEMENT_KINDS = ["consumption", "correction", "loss", "discard"] as const;
export type MovementKind = (typeof MOVEMENT_KINDS)[number];

export const movementSchema = z
  .object({
    itemId: z.uuid(),
    idempotencyKey: z.uuid(),
    expectedVersion: z.coerce.number().int().min(1),
    kind: z.enum(MOVEMENT_KINDS),
    quantity: z.string().trim().optional(),
    unit,
    note: z.string().trim().max(280).optional(),
  })
  .transform((v, ctx) => {
    // « Jeter tout » : aucune quantité, l'ensemble du produit passe en perte.
    if (v.kind === "discard") return { ...v, kind: "loss" as const, quantity: null };

    const raw = v.quantity ?? "";
    let amount: number;
    try {
      // Une correction peut ramener le stock à zéro ; une consommation non.
      if (v.kind === "correction" && /^0+([.,]0*)?$/.test(raw)) {
        amount = 0;
      } else {
        const milli = parseAmount(raw);
        if (milli === 0) throw new InvalidQuantityError("zéro");
        amount = milli / 1000;
      }
    } catch {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Quantité invalide (exemple : 1,5).",
      });
      return z.NEVER;
    }
    return { ...v, kind: v.kind, quantity: amount };
  });

export const detailsSchema = z.object({
  itemId: z.uuid(),
  expectedVersion: z.coerce.number().int().min(1),
  location: z.enum(LOCATIONS),
  expiresOn: optionalDate,
  expiryKind,
  opened: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export type PantryFormField =
  "ingredient" | "location" | "quantity" | "unit" | "expiresOn" | "expiryKind" | "note";

export interface PantryFormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<PantryFormField, string>>;
  /** Nouvelle clé d'idempotence à utiliser pour l'envoi suivant (après un succès). */
  nextKey?: string;
  /** Valeurs à réafficher après une erreur (React réinitialise le formulaire après l'envoi). */
  values?: Record<string, string>;
}

/** Valeurs textuelles d'un FormData, sans les champs techniques. */
export function echoValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$") && key !== "idempotencyKey") {
      out[key] = value;
    }
  }
  return out;
}
