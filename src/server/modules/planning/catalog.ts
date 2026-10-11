import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isMainDish, varietyKeys, type PlanCandidate } from "@/domain/planning";
import {
  estimateRecipeCost,
  millicentsToCents,
  type CostEstimate,
  type CostLine,
} from "@/domain/pricing";
import { checkCompatibility, stockCoverage } from "@/domain/recipes/compatibility";
import { fromBase } from "@/domain/units";
import { loadPriceBook, type PriceInfo } from "@/server/modules/prices/price-book";
import { householdContext, type Supabase } from "@/server/modules/recipes/queries";

export interface RecipeMeta {
  id: string;
  slug: string;
  title: string;
  baseServings: number;
  totalMinutes: number;
  prepMinutes: number;
  tags: string[];
  lines: CostLine[];
  ingredientNames: Map<string, string>;
  compatible: boolean;
  mainDish: boolean;
}

export interface PlanningCatalog {
  recipes: Map<string, RecipeMeta>;
  candidates: PlanCandidate[];
  priceBook: Map<string, PriceInfo>;
}

export interface HouseholdForPlanning {
  id: string;
  timezone: string;
  maxPrepMinutes: number | null;
}

interface RecipeRow {
  id: string;
  slug: string;
  title: string;
  servings: number;
  prep_minutes: number;
  cook_minutes: number;
  tags: string[];
  recipe_ingredients: {
    ingredient_id: string;
    quantity_base: number | null;
    dimension: "mass" | "volume" | "count" | null;
    is_optional: boolean;
    ingredients: {
      slug: string;
      name: string;
      density_g_per_ml: number | null;
      piece_weight_g: number | null;
    } | null;
  }[];
}

/**
 * Catalogue du générateur : toutes les recettes visibles par le foyer (pour afficher un menu
 * existant) et, parmi elles, les candidats : plats principaux compatibles avec le foyer
 * (allergies, régimes, aliments non souhaités) et dans son temps de préparation maximal.
 */
export async function loadPlanningCatalog(
  supabase: Supabase,
  household: HouseholdForPlanning,
): Promise<PlanningCatalog> {
  const [recipes, allergens, conflicts, ctx, priceBook] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        "id, slug, title, servings, prep_minutes, cook_minutes, tags, recipe_ingredients (ingredient_id, quantity_base, dimension, is_optional, ingredients (slug, name, density_g_per_ml, piece_weight_g))",
      )
      .eq("status", "published"),
    supabase.from("recipe_allergens").select("recipe_id, allergen_code"),
    supabase.from("recipe_diet_conflicts").select("recipe_id, diet_code"),
    householdContext(supabase, household.id, household.timezone),
    loadPriceBook(supabase, household.id),
  ]);
  if (recipes.error) throw new Error(`Lecture des recettes impossible : ${recipes.error.message}`);
  if (allergens.error) throw new Error(allergens.error.message);
  if (conflicts.error) throw new Error(conflicts.error.message);

  const allergensBy = new Map<string, string[]>();
  for (const a of allergens.data) {
    if (!a.recipe_id || !a.allergen_code) continue;
    allergensBy.set(a.recipe_id, [...(allergensBy.get(a.recipe_id) ?? []), a.allergen_code]);
  }
  const conflictsBy = new Map<string, string[]>();
  for (const d of conflicts.data) {
    if (!d.recipe_id || !d.diet_code) continue;
    conflictsBy.set(d.recipe_id, [...(conflictsBy.get(d.recipe_id) ?? []), d.diet_code]);
  }

  const priceOf = (id: string) => priceBook.get(id)?.unit ?? null;
  const metas = new Map<string, RecipeMeta>();
  const candidates: PlanCandidate[] = [];

  for (const r of recipes.data as unknown as RecipeRow[]) {
    const rows = r.recipe_ingredients ?? [];
    const lines: CostLine[] = rows.map((l) => ({
      ingredientId: l.ingredient_id,
      quantity:
        l.quantity_base !== null && l.dimension
          ? fromBase(String(l.quantity_base), l.dimension)
          : null,
      optional: l.is_optional,
      conversions: {
        densityGPerMl: l.ingredients?.density_g_per_ml ?? null,
        pieceWeightG: l.ingredients?.piece_weight_g ?? null,
      },
    }));
    const compatibility = checkCompatibility(
      {
        allergens: allergensBy.get(r.id) ?? [],
        dietConflicts: conflictsBy.get(r.id) ?? [],
        ingredients: rows.map((l) => ({ id: l.ingredient_id, optional: l.is_optional })),
      },
      ctx.constraints,
    );
    const meta: RecipeMeta = {
      id: r.id,
      slug: r.slug,
      title: r.title,
      baseServings: r.servings,
      totalMinutes: r.prep_minutes + r.cook_minutes,
      prepMinutes: r.prep_minutes,
      tags: r.tags,
      lines,
      ingredientNames: new Map(rows.map((l) => [l.ingredient_id, l.ingredients?.name ?? "?"])),
      compatible: compatibility.compatible,
      mainDish: isMainDish(r.tags),
    };
    metas.set(r.id, meta);

    const tooLong = household.maxPrepMinutes !== null && r.prep_minutes > household.maxPrepMinutes;
    if (!meta.compatible || !meta.mainDish || tooLong) continue;

    const required = rows.filter((l) => !l.is_optional);
    const estimate = estimateRecipeCost(lines, r.servings, r.servings, priceOf);
    candidates.push({
      id: r.id,
      costPerServingMillicents:
        estimate.pricedLines > 0 ? Math.round(estimate.millicents / r.servings) : null,
      missingPrices: estimate.missing.length,
      priorityUses: new Set(
        required.filter((l) => ctx.priority.has(l.ingredient_id)).map((l) => l.ingredient_id),
      ).size,
      stockCoverage: (() => {
        const c = stockCoverage(
          required.map((l) => l.ingredient_id),
          ctx.available,
        );
        return c.total ? c.inStock / c.total : 0;
      })(),
      varietyKeys: varietyKeys(required.map((l) => l.ingredients?.slug ?? "")),
    });
  }

  return { recipes: metas, candidates, priceBook };
}

/** Coût d'un plat pour un nombre de portions donné, avec les ingrédients sans prix. */
export function costOfEntry(
  meta: RecipeMeta,
  servings: number,
  priceBook: Map<string, PriceInfo>,
): { estimate: CostEstimate; cents: number; missingNames: string[] } {
  const estimate = estimateRecipeCost(
    meta.lines,
    servings,
    meta.baseServings,
    (id) => priceBook.get(id)?.unit ?? null,
  );
  return {
    estimate,
    cents: millicentsToCents(estimate.millicents),
    missingNames: estimate.missing.map((m) => meta.ingredientNames.get(m.ingredientId) ?? "?"),
  };
}

/**
 * Catalogue mémorisé pour la durée d'une requête : la page d'accueil, le menu et la liste de
 * courses peuvent en avoir besoin dans le même rendu sans relire recettes et prix.
 */
export const getPlanningCatalog = cache(
  async (householdId: string, timezone: string, maxPrepMinutes: number | null) =>
    loadPlanningCatalog(await createSupabaseServerClient(), {
      id: householdId,
      timezone,
      maxPrepMinutes,
    }),
);
