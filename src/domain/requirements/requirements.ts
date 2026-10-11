import { DomainError, InvalidQuantityError } from "../errors";
import {
  add,
  scale,
  tryConvert,
  type Dimension,
  type IngredientConversions,
  type Quantity,
} from "../units";

export type MealSlot = "breakfast" | "lunch" | "dinner";
export type MealStatus = "planned" | "cooked" | "skipped";

const SLOT_ORDER: Record<MealSlot, number> = { breakfast: 0, lunch: 1, dinner: 2 };

export interface IngredientInfo {
  id: string;
  name: string;
  /** Dimension dans laquelle les besoins sont cumulés quand une conversion existe. */
  defaultDimension: Dimension;
  conversions: IngredientConversions;
}

export interface RecipeLine {
  ingredientId: string;
  /** Quantité pour `recipe.servings` portions. */
  quantity: Quantity;
  /** Ingrédient facultatif (« au goût ») : jamais compté dans les besoins. */
  optional?: boolean;
}

export interface RecipeInput {
  id: string;
  servings: number;
  lines: readonly RecipeLine[];
}

export interface PlannedMealInput {
  id: string;
  /** Date ISO « AAAA-MM-JJ » dans le fuseau du foyer. */
  date: string;
  slot: MealSlot;
  servings: number;
  recipe: RecipeInput;
  /** Seuls les repas « planned » génèrent des besoins (un repas cuisiné a déjà décrémenté le stock). */
  status?: MealStatus;
}

/** Besoin d'un ingrédient pour un repas, normalisé dans la dimension par défaut si possible. */
export interface MealRequirement {
  mealId: string;
  date: string;
  slot: MealSlot;
  ingredientId: string;
  quantity: Quantity;
}

/** Besoin cumulé d'un ingrédient dans une dimension, sur toute la période. */
export interface RequirementTotal {
  ingredientId: string;
  quantity: Quantity;
  mealIds: string[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new InvalidQuantityError(`${label} doit être un entier supérieur ou égal à 1.`);
  }
}

export function requireIngredient(
  ingredients: ReadonlyMap<string, IngredientInfo>,
  id: string,
): IngredientInfo {
  const info = ingredients.get(id);
  if (!info) throw new DomainError("UNKNOWN_INGREDIENT", `Ingrédient inconnu : ${id}.`);
  return info;
}

/**
 * Normalise une quantité dans la dimension par défaut de l'ingrédient quand il porte
 * la conversion ; sinon elle reste dans sa dimension d'origine (ligne séparée).
 */
export function normalizeForIngredient(q: Quantity, info: IngredientInfo): Quantity {
  return tryConvert(q, info.defaultDimension, info.conversions) ?? q;
}

export function compareMeals(
  a: { date: string; slot: MealSlot },
  b: { date: string; slot: MealSlot },
): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot];
}

/**
 * Besoins par repas, ajustés au nombre de portions, triés chronologiquement.
 * Exemple : recette pour 4 avec 500 g de riz, planifiée pour 6 -> 750 g.
 */
export function computeMealRequirements(
  meals: readonly PlannedMealInput[],
  ingredients: ReadonlyMap<string, IngredientInfo>,
): MealRequirement[] {
  const result: MealRequirement[] = [];

  for (const meal of meals) {
    if ((meal.status ?? "planned") !== "planned") continue;
    if (!ISO_DATE.test(meal.date)) {
      throw new DomainError("INVALID_DATE", `Date de repas invalide : « ${meal.date} ».`);
    }
    assertPositiveInteger(meal.servings, "Le nombre de portions");
    assertPositiveInteger(meal.recipe.servings, "Le nombre de portions de la recette");

    for (const line of meal.recipe.lines) {
      if (line.optional) continue;
      const info = requireIngredient(ingredients, line.ingredientId);
      const scaled = scale(line.quantity, meal.servings, meal.recipe.servings);
      result.push({
        mealId: meal.id,
        date: meal.date,
        slot: meal.slot,
        ingredientId: info.id,
        quantity: normalizeForIngredient(scaled, info),
      });
    }
  }

  return result.sort(compareMeals);
}

export const bucketKey = (ingredientId: string, dimension: Dimension) =>
  `${ingredientId}|${dimension}`;

/** Cumule les besoins par (ingrédient, dimension), avant toute soustraction du stock. */
export function aggregateRequirements(
  requirements: readonly MealRequirement[],
): RequirementTotal[] {
  const totals = new Map<string, RequirementTotal>();
  for (const req of requirements) {
    const key = bucketKey(req.ingredientId, req.quantity.dimension);
    const current = totals.get(key);
    if (current) {
      current.quantity = add(current.quantity, req.quantity);
      if (!current.mealIds.includes(req.mealId)) current.mealIds.push(req.mealId);
    } else {
      totals.set(key, {
        ingredientId: req.ingredientId,
        quantity: req.quantity,
        mealIds: [req.mealId],
      });
    }
  }
  return [...totals.values()];
}
