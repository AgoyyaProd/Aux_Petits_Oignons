import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeObservation, robustMedian, type RejectReason } from "@/domain/pricing";
import type { Dimension } from "@/domain/units";
import type { Database, Json } from "@/types/database";
import { fetchFrenchObservations, type SourceKind } from "./open-prices";

type Client = SupabaseClient<Database>;

/** Fenêtre de relevés pris en compte. */
const WINDOW_DAYS = 180;
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

/**
 * Recalcule les prix indicatifs à partir d'Open Prices.
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
      .filter((s) => s.ingredients)
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
        if (!median) return;
        result.kept = median.kept;
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
      .eq("source", "open_prices");

    const summary: SyncSummary = {
      runId,
      total: queue.length,
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
