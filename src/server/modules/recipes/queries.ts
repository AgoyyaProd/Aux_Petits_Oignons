import "server-only";
import {
  checkCompatibility,
  matchesSearch,
  stockCoverage,
  type Compatibility,
  type HouseholdConstraints,
} from "@/domain/recipes/compatibility";
import { computeRecipeNutrition, type RecipeNutrition } from "@/domain/nutrition";
import { isPriority } from "@/domain/pantry/priority";
import { estimateRecipeCost, millicentsToCents } from "@/domain/pricing";
import { recipeDifficulty, type Difficulty } from "@/domain/recipes/difficulty";
import {
  monthOf,
  outOfSeasonIngredients,
  recipeSeason,
  type SeasonStatus,
} from "@/domain/recipes/season";
import { matchStepIngredients, parseStepTimers, type StepTimer } from "@/domain/recipes/steps";
import type { EatingStyle, FoodProfile, Objective } from "@/domain/planning";
import { withParents } from "@/domain/shopping";
import { fromBase } from "@/domain/units";
import { todayIn } from "@/lib/dates";
import { getCurrentContext } from "@/server/modules/auth/session";
import { loadPriceBook } from "@/server/modules/prices/price-book";
import { loadRatings, recipeHistory, type Rating } from "@/server/modules/recipes/ratings";
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
  const [diets, exclusions, pantry, staples, variants, profile] = await Promise.all([
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
    supabase.from("household_staples").select("ingredient_id").eq("household_id", householdId),
    supabase.from("ingredients").select("id, parent_id").not("parent_id", "is", null),
    supabase
      .from("household_food_profile")
      .select("eating_style, objectives, equipment")
      .eq("household_id", householdId)
      .maybeSingle(),
  ]);
  if (profile.error) fail("du profil alimentaire", profile.error);
  if (diets.error) fail("des régimes", diets.error);
  if (exclusions.error) fail("des exclusions", exclusions.error);
  if (pantry.error) fail("du garde-manger", pantry.error);
  if (staples.error) fail("du placard", staples.error);
  if (variants.error) fail("des variantes", variants.error);
  // Une variante en stock (Farfalle) rend son parent (Pâtes) présent.
  const parentOf = new Map(variants.data.map((v) => [v.id, v.parent_id!]));

  const constraints: HouseholdConstraints = {
    diets: new Set(diets.data.map((d) => d.diet_code)),
    allergens: new Set(exclusions.data.flatMap((e) => (e.allergen_code ? [e.allergen_code] : []))),
    avoidedIngredientIds: new Set(
      exclusions.data.flatMap((e) => (e.ingredient_id ? [e.ingredient_id] : [])),
    ),
    equipment: profile.data?.equipment ? new Set(profile.data.equipment) : null,
  };
  const foodProfile: FoodProfile = {
    style: (profile.data?.eating_style ?? "omnivore") as EatingStyle,
    objectives: (profile.data?.objectives ?? []) as Objective[],
  };
  const today = todayIn(timeZone);
  const priority = withParents(
    pantry.data
      .filter((p) =>
        isPriority(
          { expiresOn: p.expires_on, expiryKind: p.expiry_kind, openedAt: p.opened_at },
          today,
        ),
      )
      .map((p) => p.ingredient_id),
    parentOf,
  );
  // Placard : présents par déclaration du foyer (sans quantité, jamais décomptés).
  const staple = new Set(staples.data.map((s) => s.ingredient_id));
  const available = withParents([...pantry.data.map((p) => p.ingredient_id), ...staple], parentOf);
  return { constraints, available, priority, staple, foodProfile };
}

/** Libellés des allergènes et régimes, pour expliquer une exclusion. */
export async function labels(supabase: Supabase) {
  const [allergens, diets, equipment] = await Promise.all([
    supabase.from("allergens").select("code, label"),
    supabase.from("diets").select("code, label"),
    supabase.from("equipment").select("code, label").order("position"),
  ]);
  if (allergens.error) fail("des allergènes", allergens.error);
  if (diets.error) fail("des régimes", diets.error);
  if (equipment.error) fail("du matériel", equipment.error);
  return {
    allergen: new Map(allergens.data.map((a) => [a.code, a.label])),
    diet: new Map(diets.data.map((d) => [d.code, d.label])),
    equipment: new Map(equipment.data.map((e) => [e.code, e.label])),
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
  /** Avis du foyer : 1 on aime, -1 pas pour nous, null sans avis. */
  rating: Rating | null;
  /** Utilise au moins un produit à consommer vite (DLC proche, entamé). */
  usesPriority: boolean;
  /** Coût estimé par portion (ingrédients au prix connu), en centimes ; null si inconnu. */
  costPerServingCents: number | null;
  /** Des ingrédients obligatoires n'ont pas de prix : le coût est un minimum. */
  costIsMinimum: boolean;
  /** Difficulté calculée (règle fixe, voir domain/recipes/difficulty). */
  difficulty: Difficulty;
  /** Saison ce mois-ci : « in » de saison, « out » hors saison, null sans produit saisonnier. */
  season: SeasonStatus;
}

/** Seuil « petit budget » : coût estimé par portion. */
export const SMALL_BUDGET_CENTS = 250;

export interface CatalogFilters {
  q?: string;
  maxMinutes?: number;
  tag?: string;
  showExcluded?: boolean;
  favoritesOnly?: boolean;
  /** Au moins la moitié des ingrédients obligatoires en stock. */
  withStock?: boolean;
  /** Utilise un produit à consommer vite. */
  useSoon?: boolean;
  diet?: "vegetarian" | "vegan";
  smallBudget?: boolean;
  /** Uniquement les plats de saison ce mois-ci. */
  inSeason?: boolean;
}

/**
 * Catalogue visible par le foyer, filtré par ses allergies et régimes
 * (exclusion stricte), trié : compatibles d'abord, puis meilleure couverture par le stock.
 */
export async function getRecipeCatalog(filters: CatalogFilters) {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const month = monthOf(todayIn(household.timezone));
  const supabase = await createSupabaseServerClient();

  const [recipes, allergens, conflicts, ctx, names, ratings, priceBook] = await Promise.all([
    supabase
      .from("recipes")
      .select(
        "id, slug, title, description, servings, prep_minutes, cook_minutes, tags, recipe_ingredients (ingredient_id, is_optional, quantity_base, dimension, ingredients (slug, name, density_g_per_ml, piece_weight_g)), recipe_steps (count), recipe_equipment (equipment_code)",
      )
      .eq("status", "published")
      .order("title"),
    supabase.from("recipe_allergens").select("recipe_id, allergen_code"),
    supabase.from("recipe_diet_conflicts").select("recipe_id, diet_code"),
    householdContext(supabase, household.id, household.timezone),
    labels(supabase),
    loadRatings(supabase, household.id),
    loadPriceBook(supabase, household.id),
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
        equipment: (r.recipe_equipment ?? []).map((e) => e.equipment_code),
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
    const rating = ratings.get(r.id) ?? null;
    if (filters.favoritesOnly && rating !== 1) continue;
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

    const required = lines.filter((l) => !l.is_optional);
    const coverage = stockCoverage(
      required.map((l) => l.ingredient_id),
      ctx.available,
    );
    const usesPriority = required.some((l) => ctx.priority.has(l.ingredient_id));
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
    const costPerServingCents =
      estimate.pricedLines > 0
        ? Math.round(millicentsToCents(estimate.millicents) / r.servings)
        : null;
    const vegetarian = !recipeConflicts.includes("vegetarian");
    const vegan = !recipeConflicts.includes("vegan");
    const season = recipeSeason(
      lines.map((l) => ({ slug: l.ingredients?.slug ?? "", optional: l.is_optional })),
      month,
    );
    if (filters.inSeason && season !== "in") continue;
    if (filters.withStock && (coverage.total === 0 || coverage.inStock / coverage.total < 0.5)) {
      continue;
    }
    if (filters.useSoon && !usesPriority) continue;
    if (filters.diet === "vegetarian" && !vegetarian) continue;
    if (filters.diet === "vegan" && !vegan) continue;
    if (
      filters.smallBudget &&
      (costPerServingCents === null || costPerServingCents > SMALL_BUDGET_CENTS)
    ) {
      continue;
    }

    cards.push({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      servings: r.servings,
      totalMinutes,
      tags: r.tags,
      vegetarian,
      vegan,
      coverage,
      compatibility,
      exclusionLabel: describeExclusion(compatibility, names, ingredientNames),
      rating,
      usesPriority,
      costPerServingCents,
      costIsMinimum: estimate.missing.length > 0,
      difficulty: recipeDifficulty({
        prepMinutes: r.prep_minutes,
        cookMinutes: r.cook_minutes,
        steps: r.recipe_steps?.[0]?.count ?? 0,
      }),
      season,
    });
  }

  cards.sort((a, b) => {
    if (a.compatibility.compatible !== b.compatibility.compatible) {
      return a.compatibility.compatible ? -1 : 1;
    }
    // Favoris d'abord, « pas pour nous » à la fin.
    const pref = (c: RecipeCard) => (c.rating === 1 ? 0 : c.rating === -1 ? 2 : 1);
    if (pref(a) !== pref(b)) return pref(a) - pref(b);
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
    favoriteCount: [...ratings.values()].filter((v) => v === 1).length,
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
        case "equipment":
          return `Matériel : ${r.codes.map((c) => names.equipment.get(c) ?? c).join(", ")}`;
      }
    })
    .join(" · ");
}

export interface RecipeDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  /** Conseils de conservation (réfrigérateur, congélation, réchauffage). */
  storageNote: string | null;
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
    /** Coché dans le placard (présent, sans quantité). */
    inCupboard: boolean;
  }[];
  steps: string[];
  /** Par étape : ingrédients cités pour la première fois et durées (minuteurs). */
  stepDetails: { ingredientIds: string[]; timers: StepTimer[] }[];
  allergenLabels: string[];
  vegetarian: boolean;
  vegan: boolean;
  compatibility: Compatibility;
  exclusionLabel: string | null;
  /** Ingrédients facultatifs non souhaités, à laisser de côté. */
  toRemoveNames: string[];
  /** Coût estimé de la recette entière (ingrédients obligatoires au prix connu), en centimes. */
  cost: { cents: number; missingNames: string[] } | null;
  rating: Rating | null;
  history: Awaited<ReturnType<typeof recipeHistory>>;
  difficulty: Difficulty;
  /** Matériel requis (déduit des étapes), en libellés. */
  equipmentLabels: string[];
  /** Saison ce mois-ci, et produits hors saison qui l'expliquent. */
  season: SeasonStatus;
  outOfSeasonNames: string[];
  /** Valeurs nutritionnelles estimées par portion (Ciqual), null si rien n'est calculable. */
  nutrition: RecipeNutrition | null;
}

/** Valeur numérique de la base (numeric peut arriver en chaîne), null conservé. */
function num(v: number | string | null): number | null {
  return v === null ? null : Number(v);
}

export async function getRecipe(slug: string): Promise<RecipeDetail | null> {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();

  const { data: r, error } = await supabase
    .from("recipes")
    .select(
      "id, slug, title, description, storage_note, servings, prep_minutes, cook_minutes, tags, recipe_ingredients (ingredient_id, quantity, unit_code, quantity_base, dimension, is_optional, preparation_note, position, ingredients (slug, name, density_g_per_ml, piece_weight_g, ingredient_nutrition (kcal, proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g))), recipe_steps (position, instruction), recipe_equipment (equipment_code)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail("de la recette", error);
  if (!r) return null;

  const [allergens, conflicts, ctx, names, priceBook, rating, history] = await Promise.all([
    supabase.from("recipe_allergens").select("allergen_code").eq("recipe_id", r.id),
    supabase.from("recipe_diet_conflicts").select("diet_code").eq("recipe_id", r.id),
    householdContext(supabase, household.id, household.timezone),
    labels(supabase),
    loadPriceBook(supabase, household.id),
    supabase
      .from("recipe_ratings")
      .select("rating")
      .eq("household_id", household.id)
      .eq("recipe_id", r.id)
      .maybeSingle(),
    recipeHistory(supabase, household.id, r.id),
  ]);
  if (allergens.error) fail("des allergènes", allergens.error);
  if (rating.error) fail("de l'avis", rating.error);
  if (conflicts.error) fail("des régimes", conflicts.error);

  const allergenCodes = allergens.data.flatMap((a) => (a.allergen_code ? [a.allergen_code] : []));
  const dietCodes = conflicts.data.flatMap((d) => (d.diet_code ? [d.diet_code] : []));
  const lines = [...(r.recipe_ingredients ?? [])].sort((a, b) => a.position - b.position);
  const equipmentCodes = (r.recipe_equipment ?? []).map((e) => e.equipment_code);
  const compatibility = checkCompatibility(
    {
      allergens: allergenCodes,
      dietConflicts: dietCodes,
      ingredients: lines.map((l) => ({ id: l.ingredient_id, optional: l.is_optional })),
      equipment: equipmentCodes,
    },
    ctx.constraints,
  );
  const ingredientNames = new Map(lines.map((l) => [l.ingredient_id, l.ingredients?.name ?? "?"]));
  const steps = [...(r.recipe_steps ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((step) => step.instruction);

  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    storageNote: r.storage_note,
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
      inCupboard: ctx.staple.has(l.ingredient_id),
    })),
    steps,
    stepDetails: matchStepIngredients(
      steps,
      lines.map((l) => ({ id: l.ingredient_id, name: l.ingredients?.name ?? "" })),
    ).map((ingredientIds, i) => ({ ingredientIds, timers: parseStepTimers(steps[i]!) })),
    allergenLabels: allergenCodes.map((c) => names.allergen.get(c) ?? c).sort(),
    vegetarian: !dietCodes.includes("vegetarian"),
    vegan: !dietCodes.includes("vegan"),
    compatibility,
    exclusionLabel: describeExclusion(compatibility, names, ingredientNames),
    toRemoveNames: compatibility.toRemove.map((id) => ingredientNames.get(id) ?? "?"),
    rating: rating.data ? (rating.data.rating === 1 ? 1 : -1) : null,
    history,
    difficulty: recipeDifficulty({
      prepMinutes: r.prep_minutes,
      cookMinutes: r.cook_minutes,
      steps: (r.recipe_steps ?? []).length,
    }),
    equipmentLabels: [...names.equipment.entries()]
      .filter(([code]) => equipmentCodes.includes(code))
      .map(([, label]) => label),
    ...(() => {
      const month = monthOf(todayIn(household.timezone));
      const seasonal = lines.map((l) => ({
        slug: l.ingredients?.slug ?? "",
        optional: l.is_optional,
        name: l.ingredients?.name ?? "?",
      }));
      return {
        season: recipeSeason(seasonal, month),
        outOfSeasonNames: outOfSeasonIngredients(seasonal, month).map((i) => i.name),
      };
    })(),
    nutrition: computeRecipeNutrition(
      lines.map((l) => {
        const n = l.ingredients?.ingredient_nutrition ?? null;
        return {
          name: l.ingredients?.name ?? "?",
          optional: l.is_optional,
          quantity:
            l.quantity_base !== null && l.dimension
              ? fromBase(String(l.quantity_base), l.dimension)
              : null,
          conversions: {
            densityGPerMl: l.ingredients?.density_g_per_ml ?? null,
            pieceWeightG: l.ingredients?.piece_weight_g ?? null,
          },
          per100g: n
            ? {
                kcal: num(n.kcal),
                proteins: num(n.proteins_g),
                carbs: num(n.carbs_g),
                sugars: num(n.sugars_g),
                fat: num(n.fat_g),
                saturatedFat: num(n.saturated_fat_g),
                fiber: num(n.fiber_g),
                salt: num(n.salt_g),
              }
            : null,
        };
      }),
      r.servings,
    ),
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
