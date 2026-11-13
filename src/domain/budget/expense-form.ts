import { parseEurosToCents } from "@/domain/money";

/** Champs d'une dépense saisie (formulaire « Ajouter une dépense » ou fin des courses). */
export interface ExpenseInput {
  amountCents: number;
  nonFoodCents: number;
  storeLabel: string | null;
  spentOn: string;
}

export type ExpenseParse =
  | { ok: true; value: ExpenseInput }
  | { ok: false; message: string; field: "amount" | "nonFood" | "spentOn" | "store" };

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Lit les champs d'une dépense. `today` borne la date (pas de dépense dans le futur) ;
 * les montants sont lus en centimes entiers, sans flottant.
 */
export function parseExpense(
  fields: { amount: string; nonFood?: string; store?: string; spentOn?: string },
  today: string,
): ExpenseParse {
  let amountCents: number;
  try {
    amountCents = parseEurosToCents(fields.amount);
  } catch {
    return { ok: false, field: "amount", message: "Montant payé invalide. Exemple : 39,85." };
  }
  if (amountCents < 1 || amountCents > 1_000_000) {
    return {
      ok: false,
      field: "amount",
      message: "Le montant payé doit être entre 0,01 € et 10 000 €.",
    };
  }
  let nonFoodCents = 0;
  const nonFood = (fields.nonFood ?? "").trim();
  if (nonFood !== "") {
    try {
      nonFoodCents = parseEurosToCents(nonFood);
    } catch {
      return {
        ok: false,
        field: "nonFood",
        message: "Part non alimentaire invalide. Exemple : 4,50.",
      };
    }
    if (nonFoodCents > amountCents) {
      return {
        ok: false,
        field: "nonFood",
        message: "La part non alimentaire ne peut pas dépasser le total payé.",
      };
    }
  }
  const store = (fields.store ?? "").trim();
  if (store.length > 60) {
    return {
      ok: false,
      field: "store",
      message: "Nom du magasin trop long (60 caractères au plus).",
    };
  }
  const spentOn = (fields.spentOn ?? "").trim() || today;
  if (!ISO.test(spentOn) || Number.isNaN(Date.parse(spentOn))) {
    return { ok: false, field: "spentOn", message: "Date invalide." };
  }
  if (spentOn > today) {
    return { ok: false, field: "spentOn", message: "La date ne peut pas être dans le futur." };
  }
  return { ok: true, value: { amountCents, nonFoodCents, storeLabel: store || null, spentOn } };
}
