import "server-only";
import {
  checkCompatibility,
  matchesSearch,
  stockCoverage,
  type Compatibility,
  type HouseholdConstraints,
} from "@/domain/recipes/compatibility";
import { isPriority } from "@/domain/pantry/priority";
import { estimateRecipeCost, millicentsToCents } from "@/domain/pricing";
import { fromBase } from "@/domain/units";
import { todayIn } from "@/lib/dates";
import { getCurrentContext } from "@/server/modules/auth/session";
import { loadPriceBook } from "@/server/modules/prices/price-book";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export const RECIPE_TAG_LABEL: Record<string, string> = {
  plat: "Plat",
  soupe: "Soupe",
  salade: "Salade",
  dessert: "Dessert",
  "petit-dejeuner": "Petit-déjeuner",
  four: "Au four",
  poele: "À la poêle",
  economique: "Économique",
  "batch-cooking": "Se prépare à l'avance",
  "sans-cuisson": "Sans cuisson",
  mijote: "Mijoté",
};

function fail(what: string, error: { message: string }): never {
  throw new Error(`Lecture ${what} impossible : ${error.message}`);
}

/**
 * Contraintes alimentaires du foyer, ingrédients disponibles (quantité connue et non nulle)
 * et ingrédients à consommer en priorité (règle D8 : DLC proche ou produit entamé).
 */
export async function householdContext(
  supabase: Supabase,
  householdId: string,
  timeZone = "Europe/Paris",
) {
  const [diets, exclusions, pantry] = await Promise.all([
    supabase.from("household_diets").select("diet_code").eq("household_id", householdId),
    supabase
      .from("household_exclusions")
      .select("allergen_code, ingredient_id")
      .eq("household_id", householdId),
    supabase
      .from("pantry_items")
      .select("ingredient_id, expires_on, expiry_kind, opened_at")
      .eq("household_id", householdId)
      .eq("status", "active")
      .gt("quantity_base", 0),
  ]);
  if (diets.error) fail("des régimes", diets.error);
  if (exclusions.error) fail("des exclusions", exclusions.error);
  if (pantry.error) fail("du garde-manger", pantry.error);

  const constraints: HouseholdConstraints = {
    diets: new Set(diets.data.map((d) => d.diet_code)),
    allergens: new Set(exclusions.data.flatMap((e) => (e.allergen_code ? [e.allergen_code] : []))),
    avoidedIngredientIds: new Set(
      exclusions.data.flatMap((e) => (e.ingredient_id ? [e.ingredient_id] : [])),
    ),
  };
  const today = todayIn(timeZone);
  const priority = new Set(
    pantry.data
      .filter((p) =>
        isPriority(
          { expiresOn: p.expires_on, expiryKind: p.expiry_kind, openedAt: p.opened_at },
          today,
        ),
      )
      .map((p) => p.ingredient_id),
  );
  return { constraints, available: new Set(pantry.data.map((p) => p.ingredient_id)), priority };
}

/** Libellés des allergènes et régimes, pour expliquer une exclusion. */
export async function labels(supabase: Supabase) {
  const [allergens, diets] = await Promise.all([
    supabase.from("allergens").select("code, label"),
    supabase.from("diets").select("code, label"),
  ]);
  if (allergens.error) fail("des allergènes", allergens.error);
  if (diets.error) fail("des régimes", diets.error);
  return {
    allergen: new Map(allergens.data.map((a) => [a.code, a.label])),
    diet: new Map(diets.data.map((d) => [d.code, d.label])),
  };
}

function groupBy<T>(rows: T[], key: (row: T) => string | null, value: (row: T) => string | null) {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const k = key(row);
    const v = value(row);
    if (!k || !v) continue;
    const list = map.get(k);
    if (list) list.push(v);
    else map.set(k, [v]);
  }
  return map;
}

export interface RecipeCard {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  servings: number;
  totalMinutes: number;
  tags: string[];
  vegetarian: boolean;
  vegan: boolean;
  coverage: { inStock: number; total: number };
  compatibility: Compatibility;
  exclusionLabel: string | null;
}

export interface CatalogFilters {
  q?: string;
  maxMinutes?: number;
  tag?: string;
  showExcluded?: boolean;
}

/**
 * Catalogue visible par le foyer, filtré par ses allergies et régimes
 * (exclusion stricte), trié : compatibles d'abord, puis meilleure couverture par le stock.
 */
export async function getRecipeCatalog(filters: CatalogFilters) {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();

  const [recipes, allergens, conflicts, ctx, names] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        "id, slug, title, description, servings, prep_minutes, cook_minutes, tags, recipe_ingredients (ingredient_id, is_optional, ingredients (name))",
      )
      .eq("status", "published")
      .order("title"),
    supabase.from("recipe_allergens").select("recipe_id, allergen_code"),
    supabase.from("recipe_diet_conflicts").select("recipe_id, diet_code"),
    householdContext(supabase, household.id),
    labels(supabase),
  ]);
  if (recipes.error) fail("des recettes", recipes.error);
  if (allergens.error) fail("des allergènes de recettes", allergens.error);
  if (conflicts.error) fail("des régimes de recettes", conflicts.error);

  const allergensByRecipe = groupBy(
    allergens.data,
    (r) => r.recipe_id,
    (r) => r.allergen_code,
  );
  const conflictsByRecipe = groupBy(
    conflicts.data,
    (r) => r.recipe_id,
    (r) => r.diet_code,
  );

  const cards: RecipeCard[] = [];
  let excludedCount = 0;

  for (const r of recipes.data) {
    const lines = r.recipe_ingredients ?? [];
    const recipeConflicts = conflictsByRecipe.get(r.id) ?? [];
    const compatibility = checkCompatibility(
      {
        allergens: allergensByRecipe.get(r.id) ?? [],
        dietConflicts: recipeConflicts,
        ingredients: lines.map((l) => ({ id: l.ingredient_id, optional: l.is_optional })),
      },
      ctx.constraints,
    );
    if (!compatibility.compatible) excludedCount += 1;
    const ingredientNames = new Map(
      lines.map((l) => [l.ingredient_id, l.ingredients?.name ?? "?"]),
    );

    const totalMinutes = r.prep_minutes + r.cook_minutes;
    if (filters.maxMinutes && totalMinutes > filters.maxMinutes) continue;
    if (filters.tag && !r.tags.includes(filters.tag)) continue;
    if (
      filters.q &&
      !matchesSearch(
        {
          title: r.title,
          description: r.description,
          ingredientNames: lines.map((l) => l.ingredients?.name ?? ""),
        },
        filters.q,
      )
    ) {
      continue;
    }
    if (!compatibility.compatible && !filters.showExcluded) continue;

    cards.push({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      servings: r.servings,
      totalMinutes,
      tags: r.tags,
      vegetarian: !recipeConflicts.includes("vegetarian"),
      vegan: !recipeConflicts.includes("vegan"),
      coverage: stockCoverage(
        lines.filter((l) => !l.is_optional).map((l) => l.ingredient_id),
        ctx.available,
      ),
      compatibility,
      exclusionLabel: describeExclusion(compatibility, names, ingredientNames),
    });
  }

  cards.sort((a, b) => {
    if (a.compatibility.compatible !== b.compatibility.compatible) {
      return a.compatibility.compatible ? -1 : 1;
    }
    const ra = a.coverage.total ? a.coverage.inStock / a.coverage.total : 0;
    const rb = b.coverage.total ? b.coverage.inStock / b.coverage.total : 0;
    return rb - ra || a.title.localeCompare(b.title, "fr");
  });

  return {
    cards,
    excludedCount,
    hasConstraints:
      ctx.constraints.allergens.size +
        ctx.constraints.diets.size +
        ctx.constraints.avoidedIngredientIds.size >
      0,
    pantryIsEmpty: ctx.available.size === 0,
  };
}

export function describeExclusion(
  compatibility: Compatibility,
  names: Awaited<ReturnType<typeof labels>>,
  ingredientNames: ReadonlyMap<string, string>,
): string | null {
  if (compatibility.compatible) return null;
  return compatibility.reasons
    .map((r) => {
      switch (r.kind) {
        case "allergen":
          return `Allergie : ${r.codes.map((c) => names.allergen.get(c) ?? c).join(", ")}`;
        case "diet":
          return `Régime : ${r.codes.map((c) => names.diet.get(c) ?? c).join(", ")}`;
        case "ingredient":
          return `Non souhaité : ${r.ids.map((id) => ingredientNames.get(id) ?? "?").join(", ")}`;
      }
    })
    .join(" · ");
}

export interface RecipeDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  tags: string[];
  ingredients: {
    ingredientId: string;
    name: string;
    quantity: string | null;
    unit: string | null;
    optional: boolean;
    note: string | null;
    inStock: boolean;
  }[];
  steps: string[];
  allergenLabels: string[];
  vegetarian: boolean;
  vegan: boolean;
  compatibility: Compatibility;
  exclusionLabel: string | null;
  /** Ingrédients facultatifs non souhaités, à laisser de côté. */
  toRemoveNames: string[];
  /** Coût estimé de la recette entière (ingrédients obligatoires au prix connu), en centimes. */
  cost: { cents: number; missingNames: string[] } | null;
}

export async function getRecipe(slug: string): Promise<RecipeDetail | null> {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();

  const { data: r, error } = await supabase
    .from("recipes")
    .select(
      "id, slug, title, description, servings, prep_minutes, cook_minutes, tags, recipe_ingredients (ingredient_id, quantity, unit_code, quantity_base, dimension, is_optional, preparation_note, position, ingredients (name, density_g_per_ml, piece_weight_g)), recipe_steps (position, instruction)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail("de la recette", error);
  if (!r) return null;

  const [allergens, conflicts, ctx, names, priceBook] = await Promise.all([
    supabase.from("recipe_allergens").select("allergen_code").eq("recipe_id", r.id),
    supabase.from("recipe_diet_conflicts").select("diet_code").eq("recipe_id", r.id),
    householdContext(supabase, household.id, household.timezone),
    labels(supabase),
    loadPriceBook(supabase, household.id),
  ]);
  if (allergens.error) fail("des allergènes", allergens.error);
  if (conflicts.error) fail("des régimes", conflicts.error);

  const allergenCodes = allergens.data.flatMap((a) => (a.allergen_code ? [a.allergen_code] : []));
  const dietCodes = conflicts.data.flatMap((d) => (d.diet_code ? [d.diet_code] : []));
  const lines = [...(r.recipe_ingredients ?? [])].sort((a, b) => a.position - b.position);
  const compatibility = checkCompatibility(
    {
      allergens: allergenCodes,
      dietConflicts: dietCodes,
      ingredients: lines.map((l) => ({ id: l.ingredient_id, optional: l.is_optional })),
    },
    ctx.constraints,
  );
  const ingredientNames = new Map(lines.map((l) => [l.ingredient_id, l.ingredients?.name ?? "?"]));

  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    servings: r.servings,
    prepMinutes: r.prep_minutes,
    cookMinutes: r.cook_minutes,
    tags: r.tags,
    ingredients: lines.map((l) => ({
      ingredientId: l.ingredient_id,
      name: l.ingredients?.name ?? "?",
      quantity: l.quantity === null ? null : String(l.quantity),
      unit: l.unit_code,
      optional: l.is_optional,
      note: l.preparation_note,
      inStock: ctx.available.has(l.ingredient_id),
    })),
    steps: [...(r.recipe_steps ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((s) => s.instruction),
    allergenLabels: allergenCodes.map((c) => names.allergen.get(c) ?? c).sort(),
    vegetarian: !dietCodes.includes("vegetarian"),
    vegan: !dietCodes.includes("vegan"),
    compatibility,
    exclusionLabel: describeExclusion(compatibility, names, ingredientNames),
    toRemoveNames: compatibility.toRemove.map((id) => ingredientNames.get(id) ?? "?"),
    cost: (() => {
      const estimate = estimateRecipeCost(
        lines.map((l) => ({
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
        })),
        r.servings,
        r.servings,
        (id) => priceBook.get(id)?.unit ?? null,
      );
      if (estimate.pricedLines === 0) return null;
      return {
        cents: millicentsToCents(estimate.millicents),
        missingNames: estimate.missing.map((m) => ingredientNames.get(m.ingredientId) ?? "?"),
      };
    })(),
  };
}
