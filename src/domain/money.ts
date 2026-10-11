import { InvalidQuantityError } from "./errors";

/** Lit un montant en euros saisi (« 45 », « 45,5 », « 45.50 ») en centimes entiers, sans flottant. */
export function parseEurosToCents(input: string): number {
  const match = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(input.trim().replace(/\s|€/g, ""));
  if (!match) {
    throw new InvalidQuantityError(`Montant invalide : « ${input} ». Exemple : 85 ou 85,50.`);
  }
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function formatCents(cents: number, currency = "EUR"): string {
  if (currency === "EUR") return euro.format(cents / 100);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(cents / 100);
}

/** Valeur à afficher dans un champ de saisie (« 85,50 »). */
export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  const euros = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest === 0 ? String(euros) : `${euros},${String(rest).padStart(2, "0")}`;
}
