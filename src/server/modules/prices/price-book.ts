import "server-only";
import { MIN_RELIABLE_SAMPLE, type UnitPrice } from "@/domain/pricing";
import type { Supabase } from "@/server/modules/recipes/queries";

export type PriceSource = "household" | "open_prices" | "free";

export interface PriceInfo {
  unit: UnitPrice;
  source: PriceSource;
  /** Nombre de relevés retenus (prix indicatif). */
  sampleSize: number;
  /** Date du relevé le plus récent, ou de la saisie du foyer. */
  observedTo: string | null;
  storeLabel: string | null;
  /** Catégorie Open Prices approchante (ex. chou rouge -> choux). */
  approximate: boolean;
  /** Prix indicatif établi sur peu de relevés. */
  lowSample: boolean;
}

/**
 * Prix connus pour le foyer : sa propre saisie l'emporte sur le prix indicatif.
 * Un ingrédient absent de la carte n'a PAS de prix (jamais de valeur par défaut).
 */
export async function loadPriceBook(
  supabase: Supabase,
  householdId: string,
): Promise<Map<string, PriceInfo>> {
  const [reference, household, sources] = await Promise.all([
    supabase
      .from("reference_prices")
      .select("ingredient_id, source, dimension, cents_per_ref, sample_size, observed_to"),
    supabase
      .from("household_prices")
      .select("ingredient_id, dimension, cents_per_ref, store_label, observed_on")
      .eq("household_id", householdId),
    supabase.from("ingredient_price_sources").select("ingredient_id, approximate"),
  ]);
  if (reference.error) throw new Error(`Lecture des prix impossible : ${reference.error.message}`);
  if (household.error) throw new Error(`Lecture des prix impossible : ${household.error.message}`);
  if (sources.error) throw new Error(`Lecture des prix impossible : ${sources.error.message}`);

  const approximate = new Set(
    sources.data.filter((s) => s.approximate).map((s) => s.ingredient_id),
  );
  const book = new Map<string, PriceInfo>();
  for (const r of reference.data) {
    const source: PriceSource = r.source === "free" ? "free" : "open_prices";
    book.set(r.ingredient_id, {
      unit: { dimension: r.dimension, centsPerRef: r.cents_per_ref },
      source,
      sampleSize: r.sample_size,
      observedTo: r.observed_to,
      storeLabel: null,
      approximate: approximate.has(r.ingredient_id),
      lowSample: source === "open_prices" && r.sample_size < MIN_RELIABLE_SAMPLE,
    });
  }
  for (const h of household.data) {
    book.set(h.ingredient_id, {
      unit: { dimension: h.dimension, centsPerRef: h.cents_per_ref },
      source: "household",
      sampleSize: 1,
      observedTo: h.observed_on,
      storeLabel: h.store_label,
      approximate: false,
      lowSample: false,
    });
  }
  return book;
}
