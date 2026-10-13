import "server-only";
import { MIN_RELIABLE_SAMPLE, REF_LABEL } from "@/domain/pricing";
import { normalizeText } from "@/domain/recipes/compatibility";
import type { Dimension } from "@/domain/units";
import { getCurrentContext } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export interface PriceRow {
  ingredientId: string;
  name: string;
  category: string;
  dimension: Dimension;
  refLabel: string;
  reference: {
    cents: number;
    sampleSize: number;
    observedTo: string | null;
    lowSample: boolean;
    free: boolean;
    /** Prix tiré de tickets de caisse (sinon : relevés Open Prices). */
    receipts: boolean;
  } | null;
  approximate: boolean;
  noSource: boolean;
  mine: {
    cents: number;
    dimension: Dimension;
    storeLabel: string | null;
    observedOn: string;
    sourceUrl: string | null;
  } | null;
}

/** Tous les ingrédients avec leur prix indicatif et le prix du foyer. */
export async function getPricesPage(q?: string) {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();

  const [ingredients, reference, mine, sources, settings, isAdmin] = await Promise.all([
    supabase.from("ingredients").select("id, name, category, default_dimension").order("name"),
    supabase
      .from("reference_prices")
      .select("ingredient_id, source, cents_per_ref, sample_size, observed_to"),
    supabase
      .from("household_prices")
      .select("ingredient_id, dimension, cents_per_ref, store_label, observed_on, source_url")
      .eq("household_id", household.id),
    supabase.from("ingredient_price_sources").select("ingredient_id, kind, approximate"),
    supabase.from("households").select("reference_store").eq("id", household.id).single(),
    supabase.rpc("is_app_admin"),
  ]);
  for (const r of [ingredients, reference, mine, sources, settings]) {
    if (r.error) throw new Error(`Lecture des prix impossible : ${r.error.message}`);
  }

  const refBy = new Map(reference.data!.map((r) => [r.ingredient_id, r]));
  const mineBy = new Map(mine.data!.map((r) => [r.ingredient_id, r]));
  const sourceBy = new Map(sources.data!.map((r) => [r.ingredient_id, r]));
  const query = q ? normalizeText(q) : "";

  const rows: PriceRow[] = ingredients
    .data!.filter((i) => !query || normalizeText(i.name).includes(query))
    .map((i) => {
      const ref = refBy.get(i.id);
      const own = mineBy.get(i.id);
      const src = sourceBy.get(i.id);
      return {
        ingredientId: i.id,
        name: i.name,
        category: i.category,
        dimension: i.default_dimension,
        refLabel: REF_LABEL[i.default_dimension],
        reference: ref
          ? {
              cents: ref.cents_per_ref,
              sampleSize: ref.sample_size,
              observedTo: ref.observed_to,
              lowSample: ref.source === "open_prices" && ref.sample_size < MIN_RELIABLE_SAMPLE,
              free: ref.source === "free",
              receipts: ref.source === "receipts",
            }
          : null,
        approximate: src?.approximate ?? false,
        noSource: !src || src.kind === "none",
        mine: own
          ? {
              cents: own.cents_per_ref,
              dimension: own.dimension,
              storeLabel: own.store_label,
              observedOn: own.observed_on,
              sourceUrl: own.source_url,
            }
          : null,
      };
    });

  const priced = reference.data!.filter((r) => r.source !== "free").length;
  let lastRun = null;
  if (isAdmin.data) {
    const run = await supabase
      .from("price_sync_runs")
      .select("started_at, finished_at, status, ingredients_total, ingredients_priced")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    lastRun = run.data;
  }

  return {
    householdId: household.id,
    referenceStore: settings.data!.reference_store,
    rows,
    coverage: { priced, total: ingredients.data!.length, mine: mine.data!.length },
    isAdmin: Boolean(isAdmin.data),
    lastRun,
  };
}
