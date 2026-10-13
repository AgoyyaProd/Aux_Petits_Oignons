import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MIN_PUBLISH_SAMPLE,
  normalizeObservation,
  receiptUnitPrice,
  robustMedian,
  type ReceiptLine,
  type RejectReason,
} from "@/domain/pricing";
import type { Dimension } from "@/domain/units";
import type { Database, Json } from "@/types/database";
import { fetchFrenchObservations, type SourceKind } from "./open-prices";

type Client = SupabaseClient<Database>;

/** Fenêtre de relevés pris en compte (les 100 plus récents par catégorie). */
const WINDOW_DAYS = 365;
const CONCURRENCY = 6;

export interface IngredientSyncResult {
  slug: string;
  received: number;
  accepted: number;
  kept: number;
  centsPerRef: number | null;
  rejected: Partial<Record<RejectReason, number>>;
  error?: string;
}

export interface SyncSummary {
  runId: number;
  /** Ingrédients dont le prix vient des tickets de caisse. */
  receipts: number;
  total: number;
  priced: number;
  updated: number;
  failed: number;
  timedOut: number;
}

function isoDaysAgo(days: number, now: Date): string {
  const d = new Date(now.getTime() - days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

interface SourceRow {
  ingredient_id: string;
  kind: string;
  tags: string[];
  ingredients: {
    slug: string;
    default_dimension: Dimension;
    density_g_per_ml: number | null;
    piece_weight_g: number | null;
  } | null;
}

interface ReceiptRow {
  ingredient_id: string;
  purchased_on: string;
  pack_quantity: number;
  pack_unit: ReceiptLine["packUnit"];
  cents: number;
  ingredients: {
    default_dimension: Dimension;
    density_g_per_ml: number | null;
    piece_weight_g: number | null;
  } | null;
}

/**
 * Prix indicatifs tirés des tickets de caisse des 12 derniers mois (médiane robuste).
 * Ils remplacent le prix Open Prices de l'ingrédient : ce sont des prix réellement payés.
 * Un ingrédient dont les tickets ont tous vieilli repasse à Open Prices.
 * Renvoie les ingrédients ainsi tarifés.
 */
export async function syncReceiptPrices(supabase: Client, now = new Date()): Promise<Set<string>> {
  const since = isoDaysAgo(WINDOW_DAYS, now);
  const [lines, existing] = await Promise.all([
    supabase
      .from("receipt_prices")
      .select(
        "ingredient_id, purchased_on, pack_quantity, pack_unit, cents, ingredients (default_dimension, density_g_per_ml, piece_weight_g)",
      )
      .gte("purchased_on", since),
    supabase.from("reference_prices").select("ingredient_id").eq("source", "receipts"),
  ]);
  if (lines.error) throw new Error(`Tickets de caisse : ${lines.error.message}`);
  if (existing.error) throw new Error(`Tickets de caisse : ${existing.error.message}`);

  const byIngredient = new Map<string, { values: number[]; dates: string[] }>();
  for (const row of lines.data as unknown as ReceiptRow[]) {
    const ing = row.ingredients;
    if (!ing) continue;
    const value = receiptUnitPrice(
      { cents: row.cents, packQuantity: Number(row.pack_quantity), packUnit: row.pack_unit },
      ing.default_dimension,
      { densityGPerMl: ing.density_g_per_ml, pieceWeightG: ing.piece_weight_g },
    );
    if (value === null) continue;
    const entry = byIngredient.get(row.ingredient_id) ?? { values: [], dates: [] };
    entry.values.push(value);
    entry.dates.push(row.purchased_on);
    byIngredient.set(row.ingredient_id, entry);
  }

  const dimensions = new Map(
    (lines.data as unknown as ReceiptRow[]).map((r) => [
      r.ingredient_id,
      r.ingredients!.default_dimension,
    ]),
  );
  const rows = [];
  for (const [ingredientId, { values, dates }] of byIngredient) {
    const median = robustMedian(values);
    if (!median) continue;
    dates.sort();
    rows.push({
      ingredient_id: ingredientId,
      source: "receipts",
      dimension: dimensions.get(ingredientId)!,
      cents_per_ref: median.value,
      sample_size: median.kept,
      observed_from: dates[0]!,
      observed_to: dates[dates.length - 1]!,
      computed_at: new Date().toISOString(),
    });
  }
  if (rows.length > 0) {
    const write = await supabase.from("reference_prices").upsert(rows);
    if (write.error) throw new Error(`Tickets de caisse : ${write.error.message}`);
  }
  const priced = new Set(rows.map((r) => r.ingredient_id));
  const stale = existing.data.map((r) => r.ingredient_id).filter((id) => !priced.has(id));
  if (stale.length > 0) {
    const drop = await supabase
      .from("reference_prices")
      .delete()
      .in("ingredient_id", stale)
      .eq("source", "receipts");
    if (drop.error) throw new Error(`Tickets de caisse : ${drop.error.message}`);
  }
  return priced;
}

/**
 * Recalcule les prix indicatifs : d'abord les tickets de caisse, puis Open Prices pour les
 * ingrédients sans ticket récent.
 * - Les ingrédients au prix le plus ancien passent en premier : si le temps manque,
 *   la synchronisation suivante reprend là où celle-ci s'est arrêtée.
 * - Un ingrédient sans relevé exploitable garde son prix précédent (daté) ou reste sans prix.
 * Le client fourni doit avoir le droit d'écrire les prix (administrateur ou service).
 */
export async function syncReferencePrices(
  supabase: Client,
  {
    startedBy = null,
    now = new Date(),
    deadlineMs = 50_000,
    fetchImpl,
  }: {
    startedBy?: string | null;
    now?: Date;
    deadlineMs?: number;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<SyncSummary> {
  const started = Date.now();
  const run = await supabase
    .from("price_sync_runs")
    .insert({ started_by: startedBy })
    .select("id")
    .single();
  if (run.error) throw new Error(`Journal de synchronisation : ${run.error.message}`);
  const runId = run.data.id;

  try {
    const fromReceipts = await syncReceiptPrices(supabase, now);
    const [sources, existing] = await Promise.all([
      supabase
        .from("ingredient_price_sources")
        .select(
          "ingredient_id, kind, tags, ingredients (slug, default_dimension, density_g_per_ml, piece_weight_g)",
        )
        .in("kind", ["raw", "product"]),
      supabase.from("reference_prices").select("ingredient_id, computed_at"),
    ]);
    if (sources.error) throw new Error(sources.error.message);
    if (existing.error) throw new Error(existing.error.message);

    const lastComputed = new Map(existing.data.map((r) => [r.ingredient_id, r.computed_at]));
    const queue = (sources.data as unknown as SourceRow[])
      .filter((s) => s.ingredients && !fromReceipts.has(s.ingredient_id))
      .sort((a, b) =>
        (lastComputed.get(a.ingredient_id) ?? "").localeCompare(
          lastComputed.get(b.ingredient_id) ?? "",
        ),
      );

    const since = isoDaysAgo(WINDOW_DAYS, now);
    const details: Record<string, IngredientSyncResult> = {};
    let updated = 0;
    let failed = 0;
    let timedOut = 0;

    const work = async (source: SourceRow) => {
      const ing = source.ingredients!;
      const result: IngredientSyncResult = {
        slug: ing.slug,
        received: 0,
        accepted: 0,
        kept: 0,
        centsPerRef: null,
        rejected: {},
      };
      details[ing.slug] = result;
      if (Date.now() - started > deadlineMs) {
        result.error = "timeout";
        timedOut += 1;
        return;
      }
      try {
        const values: number[] = [];
        const dates: string[] = [];
        for (const tag of source.tags) {
          const { observations, received } = await fetchFrenchObservations(
            source.kind as SourceKind,
            tag,
            since,
            fetchImpl,
          );
          result.received += received;
          for (const obs of observations) {
            const normalized = normalizeObservation(obs, ing.default_dimension, {
              densityGPerMl: ing.density_g_per_ml,
              pieceWeightG: ing.piece_weight_g,
            });
            if ("rejected" in normalized) {
              result.rejected[normalized.rejected] =
                (result.rejected[normalized.rejected] ?? 0) + 1;
              continue;
            }
            values.push(normalized.centsPerRef);
            dates.push(obs.date);
          }
        }
        result.accepted = values.length;
        const median = robustMedian(values);
        result.kept = median?.kept ?? 0;
        if (!median || median.kept < MIN_PUBLISH_SAMPLE) {
          // Trop peu de relevés : pas de prix plutôt qu'un prix douteux, ancien compris.
          const drop = await supabase
            .from("reference_prices")
            .delete()
            .eq("ingredient_id", source.ingredient_id)
            .eq("source", "open_prices");
          if (drop.error) throw new Error(drop.error.message);
          return;
        }
        result.centsPerRef = median.value;
        dates.sort();
        const write = await supabase.from("reference_prices").upsert({
          ingredient_id: source.ingredient_id,
          source: "open_prices",
          dimension: ing.default_dimension,
          cents_per_ref: median.value,
          sample_size: median.kept,
          observed_from: dates[0]!,
          observed_to: dates[dates.length - 1]!,
          computed_at: new Date().toISOString(),
        });
        if (write.error) throw new Error(write.error.message);
        updated += 1;
      } catch (error) {
        failed += 1;
        result.error = error instanceof Error ? error.message.slice(0, 200) : "erreur inconnue";
      }
    };

    // Petit pool de requêtes parallèles : rapide sans surcharger le service.
    let next = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (next < queue.length) {
          const source = queue[next++]!;
          await work(source);
        }
      }),
    );

    const priced = await supabase
      .from("reference_prices")
      .select("ingredient_id", { count: "exact", head: true })
      .in("source", ["open_prices", "receipts"]);

    const summary: SyncSummary = {
      runId,
      receipts: fromReceipts.size,
      total: queue.length + fromReceipts.size,
      priced: priced.count ?? 0,
      updated,
      failed,
      timedOut,
    };
    await supabase
      .from("price_sync_runs")
      .update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        ingredients_total: summary.total,
        ingredients_priced: summary.priced,
        details: details as unknown as NonNullable<Json>,
      })
      .eq("id", runId);
    return summary;
  } catch (error) {
    await supabase
      .from("price_sync_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : "erreur inconnue" },
      })
      .eq("id", runId);
    throw error;
  }
}
