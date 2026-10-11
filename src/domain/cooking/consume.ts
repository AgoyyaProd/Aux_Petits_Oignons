import {
  normalizeForIngredient,
  requireIngredient,
  type IngredientInfo,
  type RecipeLine,
} from "../requirements/requirements";
import { fromMilli, scale, tryConvert, type Quantity } from "../units";

/** Un lot du garde-manger, avec sa version (contrôle de concurrence côté base). */
export interface CookLot {
  id: string;
  ingredientId: string;
  /** null = quantité inconnue : jamais décomptée (on ne retire pas ce qu'on ne connaît pas). */
  quantity: Quantity | null;
  expiresOn: string | null;
  expiryKind: "use_by" | "best_before" | null;
  opened: boolean;
  version: number;
}

export interface Consumption {
  lotId: string;
  version: number;
  /** Quantité retirée, dans la dimension du lot. */
  quantity: Quantity;
}

export interface CookingPlan {
  consumptions: Consumption[];
  /** Part du besoin introuvable en stock (rien n'est retiré pour elle). */
  missing: { ingredientId: string; quantity: Quantity }[];
  /** Ingrédients du placard : présents, jamais décomptés. */
  fromCupboard: string[];
}

/** Entamés d'abord, puis péremption la plus proche, puis sans date ; ordre stable. */
function fefo(a: CookLot, b: CookLot): number {
  if (a.opened !== b.opened) return a.opened ? -1 : 1;
  const ea = a.expiresOn ?? "9999-12-31";
  const eb = b.expiresOn ?? "9999-12-31";
  if (ea !== eb) return ea < eb ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Décompte d'un plat cuisiné : pour chaque ingrédient obligatoire, ajusté aux portions,
 * on retire du stock en FEFO. Un lot à DLC dépassée n'est pas utilisé ; un lot à quantité
 * inconnue non plus ; une conversion absente n'est jamais devinée (le lot est ignoré).
 * Fonction pure : même entrée, même décompte.
 */
export function planCooking(input: {
  lines: readonly RecipeLine[];
  servings: number;
  baseServings: number;
  ingredients: ReadonlyMap<string, IngredientInfo>;
  lots: readonly CookLot[];
  cupboard: ReadonlySet<string>;
  today: string;
}): CookingPlan {
  const remaining = new Map<string, number>(); // millièmes, dimension du lot
  for (const lot of input.lots) if (lot.quantity) remaining.set(lot.id, lot.quantity.milli);
  const taken = new Map<string, number>();
  const missing: CookingPlan["missing"] = [];
  const fromCupboard = new Set<string>();

  for (const line of input.lines) {
    if (line.optional) continue;
    if (input.cupboard.has(line.ingredientId)) {
      fromCupboard.add(line.ingredientId);
      continue;
    }
    const info = requireIngredient(input.ingredients, line.ingredientId);
    const need = normalizeForIngredient(
      scale(line.quantity, input.servings, input.baseServings),
      info,
    );
    let left = need.milli;

    const lots = input.lots
      .filter(
        (l) =>
          l.ingredientId === line.ingredientId &&
          l.quantity !== null &&
          !(l.expiryKind === "use_by" && l.expiresOn !== null && l.expiresOn < input.today),
      )
      .sort(fefo);

    for (const lot of lots) {
      if (left === 0) break;
      const rest = remaining.get(lot.id) ?? 0;
      if (rest === 0) continue;
      const lotDim = lot.quantity!.dimension;
      // Disponible exprimé dans la dimension du besoin.
      const available =
        lotDim === need.dimension
          ? rest
          : tryConvert(fromMilli(rest, lotDim), need.dimension, info.conversions)?.milli;
      if (available === undefined || available === 0) continue;

      const take = Math.min(available, left);
      let takeLot: number;
      if (lotDim === need.dimension) takeLot = take;
      else if (take === available) takeLot = rest;
      else {
        const back = tryConvert(fromMilli(take, need.dimension), lotDim, info.conversions);
        if (!back) continue;
        takeLot = Math.min(back.milli, rest);
      }
      if (takeLot === 0) continue;
      remaining.set(lot.id, rest - takeLot);
      taken.set(lot.id, (taken.get(lot.id) ?? 0) + takeLot);
      left -= take;
    }
    if (left > 0)
      missing.push({ ingredientId: line.ingredientId, quantity: fromMilli(left, need.dimension) });
  }

  const consumptions: Consumption[] = input.lots
    .filter((l) => (taken.get(l.id) ?? 0) > 0)
    .map((l) => ({
      lotId: l.id,
      version: l.version,
      quantity: fromMilli(taken.get(l.id)!, l.quantity!.dimension),
    }));
  return { consumptions, missing, fromCupboard: [...fromCupboard] };
}
