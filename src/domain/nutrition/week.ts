import type { IngredientConversions, Quantity } from "../units";
import {
  gramsOf,
  NUTRIENTS,
  type Nutrient,
  type NutrientTotal,
  type RecipeNutrition,
} from "./nutrition";

/**
 * Équilibre d'un menu de la semaine, calculé sur les seuls repas du menu.
 *
 * Repères : recommandations du Programme national nutrition santé pour les adultes
 * (PNNS 4, « Manger Bouger », Santé publique France) :
 *  - poisson : 2 fois par semaine ;
 *  - légumes secs (légumineuses) : au moins 2 fois par semaine ;
 *  - viande hors volaille (bœuf, porc, veau, agneau) : 500 g maximum par semaine ;
 *  - charcuterie : 150 g maximum par semaine.
 * Les quantités sont comptées crues, par portion, c'est-à-dire par personne.
 */

/** Viandes hors volaille du référentiel. */
export const RED_MEAT_SLUGS: ReadonlySet<string> = new Set([
  "boeuf-bourguignon",
  "boeuf-hache",
  "boeuf-steak",
  "agneau",
  "veau",
  "porc-cote",
  "porc-filet",
]);

/** Charcuteries du référentiel. */
export const CHARCUTERIE_SLUGS: ReadonlySet<string> = new Set([
  "jambon",
  "jambon-cru",
  "lardon",
  "chorizo",
  "saucisse",
  "merguez",
]);

export const PNNS = {
  fishMealsPerWeek: 2,
  legumeMealsPerWeek: 2,
  redMeatMaxGPerWeek: 500,
  charcuterieMaxGPerWeek: 150,
} as const;

/** Composition d'une portion de recette, déduite de ses ingrédients obligatoires. */
export interface PortionProfile {
  hasFish: boolean;
  hasLegumes: boolean;
  hasMeat: boolean;
  /** Grammes crus par portion ; null si un ingrédient du groupe n'a pas de poids connu. */
  redMeatG: number | null;
  charcuterieG: number | null;
}

export interface ProfileLine {
  slug: string;
  category: string;
  optional: boolean;
  quantity: Quantity | null;
  conversions: IngredientConversions;
}

/** Composition d'une portion à partir des ingrédients OBLIGATOIRES de la recette. */
export function portionProfile(lines: readonly ProfileLine[], servings: number): PortionProfile {
  let redMeat: number | null = 0;
  let charcuterie: number | null = 0;
  let hasFish = false;
  let hasLegumes = false;
  let hasMeat = false;
  for (const l of lines) {
    if (l.optional) continue;
    if (l.category === "poissons") hasFish = true;
    if (l.category === "legumineuses") hasLegumes = true;
    if (l.category === "viandes") hasMeat = true;
    const red = RED_MEAT_SLUGS.has(l.slug);
    const charc = CHARCUTERIE_SLUGS.has(l.slug);
    if (!red && !charc) continue;
    const g = l.quantity ? gramsOf(l.quantity, l.conversions) : null;
    const perPortion = g === null || !(servings > 0) ? null : g / servings;
    if (red) redMeat = redMeat === null || perPortion === null ? null : redMeat + perPortion;
    if (charc)
      charcuterie = charcuterie === null || perPortion === null ? null : charcuterie + perPortion;
  }
  return { hasFish, hasLegumes, hasMeat, redMeatG: redMeat, charcuterieG: charcuterie };
}

export interface WeekMeal {
  title: string;
  /** Valeurs par portion, ou null / non fiable : le plat n'entre pas dans les moyennes. */
  nutrition: RecipeNutrition | null;
  profile: PortionProfile;
}

export interface WeekBalance {
  meals: number;
  /** Repas comptés dans les moyennes nutritionnelles. */
  measuredMeals: number;
  /** Moyenne par portion sur les repas mesurés. */
  averagePerPortion: Record<Nutrient, NutrientTotal> | null;
  fishMeals: number;
  legumeMeals: number;
  vegetarianMeals: number;
  /** Total par personne sur la semaine ; partial si un poids manque. */
  redMeatG: { value: number; partial: boolean };
  charcuterieG: { value: number; partial: boolean };
  /** Plats sans estimation nutritionnelle fiable. */
  unmeasured: string[];
}

export function weekBalance(meals: readonly WeekMeal[]): WeekBalance {
  const sums = Object.fromEntries(
    NUTRIENTS.map((n) => [n, { value: 0, partial: false }]),
  ) as Record<Nutrient, NutrientTotal>;
  let measured = 0;
  const unmeasured: string[] = [];
  const redMeat = { value: 0, partial: false };
  const charcuterie = { value: 0, partial: false };
  let fish = 0;
  let legumes = 0;
  let vegetarian = 0;

  for (const meal of meals) {
    const n = meal.nutrition;
    if (n && n.reliable) {
      measured += 1;
      for (const k of NUTRIENTS) {
        sums[k].value += n.perServing[k].value;
        if (n.perServing[k].partial) sums[k].partial = true;
      }
    } else {
      unmeasured.push(meal.title);
    }
    const p = meal.profile;
    if (p.hasFish) fish += 1;
    if (p.hasLegumes) legumes += 1;
    if (!p.hasMeat && !p.hasFish) vegetarian += 1;
    if (p.redMeatG === null) redMeat.partial = true;
    else redMeat.value += p.redMeatG;
    if (p.charcuterieG === null) charcuterie.partial = true;
    else charcuterie.value += p.charcuterieG;
  }

  if (measured > 0) for (const k of NUTRIENTS) sums[k].value /= measured;

  return {
    meals: meals.length,
    measuredMeals: measured,
    averagePerPortion: measured > 0 ? sums : null,
    fishMeals: fish,
    legumeMeals: legumes,
    vegetarianMeals: vegetarian,
    redMeatG: redMeat,
    charcuterieG: charcuterie,
    unmeasured,
  };
}

export type BalanceStatus = "ok" | "low" | "high";

/** Comparaison aux repères, dans le sens de chaque recommandation. */
export function balanceStatuses(b: WeekBalance) {
  return {
    fish: (b.fishMeals >= PNNS.fishMealsPerWeek ? "ok" : "low") as BalanceStatus,
    legumes: (b.legumeMeals >= PNNS.legumeMealsPerWeek ? "ok" : "low") as BalanceStatus,
    redMeat: (b.redMeatG.value > PNNS.redMeatMaxGPerWeek ? "high" : "ok") as BalanceStatus,
    charcuterie: (b.charcuterieG.value > PNNS.charcuterieMaxGPerWeek
      ? "high"
      : "ok") as BalanceStatus,
  };
}
