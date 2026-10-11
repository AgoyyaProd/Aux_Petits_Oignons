import { DomainError } from "../errors";
import { MAX_PER_FAMILY } from "./variety";

/**
 * Générateur de menu : déterministe (même demande + même graine = même menu),
 * sans IA, sans prix inventé.
 *
 * Ordre des critères :
 *  1. les candidats sont déjà compatibles avec le foyer (filtrés en amont, contrôlés en base) ;
 *  2. budget : on ne choisit un plat que s'il laisse de quoi compléter le menu dans le budget ;
 *  3. anti-gaspillage : plats qui utilisent des produits à consommer en priorité, puis le stock ;
 *  4. variété : pas deux fois la même recette, au plus 2 plats par famille de féculent/protéine ;
 *  5. une part de hasard reproductible (graine) pour que « Relancer » propose autre chose.
 */

export interface PlanCandidate {
  id: string;
  /**
   * Coût d'UNE portion en millièmes de centime, limité aux ingrédients dont le prix est connu ;
   * null si aucun ingrédient n'a de prix.
   */
  costPerServingMillicents: number | null;
  /** Ingrédients obligatoires sans prix : le coût affiché est alors un minimum. */
  missingPrices: number;
  /** Nombre d'ingrédients prioritaires du garde-manger (DLC proche, entamés) utilisés. */
  priorityUses: number;
  /** Part des ingrédients obligatoires présents en stock, entre 0 et 1. */
  stockCoverage: number;
  varietyKeys: readonly string[];
}

export interface PlanRequest {
  mealCount: number;
  people: number;
  budgetCents: number | null;
  /** Plats gardés (verrouillés) : ils comptent dans le nombre de repas et le budget. */
  locked: readonly { recipeId: string; servings: number }[];
  /** Recettes à ne pas proposer (ex. retirées par l'utilisateur). */
  excludeRecipeIds?: readonly string[];
  seed: number;
}

export interface PlanEntry {
  recipeId: string;
  servings: number;
  locked: boolean;
}

export interface PlanResult {
  entries: PlanEntry[];
  /** Coût des plats chiffrés, en millièmes de centime. */
  knownMillicents: number;
  /** Nombre de plats dont le coût est incomplet (au moins un ingrédient sans prix). */
  unpricedEntries: number;
  status: "ok" | "over_budget" | "not_enough_recipes";
}

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function entryCost(c: PlanCandidate | undefined, servings: number): number | null {
  return c && c.costPerServingMillicents !== null ? c.costPerServingMillicents * servings : null;
}

function familyCounts(ids: readonly string[], byId: ReadonlyMap<string, PlanCandidate>) {
  const counts = new Map<string, number>();
  for (const id of ids) {
    for (const key of byId.get(id)?.varietyKeys ?? []) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function respectsVariety(c: PlanCandidate, counts: ReadonlyMap<string, number>): boolean {
  return c.varietyKeys.every((k) => (counts.get(k) ?? 0) < MAX_PER_FAMILY);
}

export function generatePlan(candidates: readonly PlanCandidate[], req: PlanRequest): PlanResult {
  if (!Number.isInteger(req.mealCount) || req.mealCount < 1 || req.mealCount > 21) {
    throw new DomainError("INVALID_PLAN", "Entre 1 et 21 repas par semaine.");
  }
  if (!Number.isInteger(req.people) || req.people < 1 || req.people > 20) {
    throw new DomainError("INVALID_PLAN", "Entre 1 et 20 personnes.");
  }
  if (req.locked.length > req.mealCount) {
    throw new DomainError("INVALID_PLAN", "Plus de plats gardés que de repas demandés.");
  }

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const random = seededRandom(req.seed);
  // Tirage fait dans l'ordre stable des identifiants : le résultat ne dépend pas de l'ordre reçu.
  const jitter = new Map(
    [...candidates].sort((a, b) => a.id.localeCompare(b.id)).map((c) => [c.id, random()]),
  );
  const score = (c: PlanCandidate) =>
    3 * Math.min(c.priorityUses, 3) + 2 * c.stockCoverage + 1.5 * (jitter.get(c.id) ?? 0);

  const entries: PlanEntry[] = req.locked.map((l) => ({
    recipeId: l.recipeId,
    servings: l.servings,
    locked: true,
  }));
  const taken = new Set(entries.map((e) => e.recipeId));
  const excluded = new Set(req.excludeRecipeIds ?? []);
  const budget = req.budgetCents === null ? null : req.budgetCents * 1000;

  let spent = 0;
  for (const e of entries) spent += entryCost(byId.get(e.recipeId), e.servings) ?? 0;

  const pool = candidates
    .filter((c) => !taken.has(c.id) && !excluded.has(c.id))
    .sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));

  const costFor = (c: PlanCandidate) => entryCost(c, req.people);

  // Passes successives, du plus exigeant au plus souple : avec un budget, un plat sans prix
  // n'arrive qu'après avoir relâché la variété (le budget prime sur la variété).
  const passes =
    budget === null
      ? [
          { variety: true, pricedOnly: false },
          { variety: false, pricedOnly: false },
        ]
      : [
          { variety: true, pricedOnly: true },
          { variety: false, pricedOnly: true },
          { variety: false, pricedOnly: false },
        ];
  for (const pass of passes) {
    while (entries.length < req.mealCount) {
      const counts = familyCounts(
        entries.map((e) => e.recipeId),
        byId,
      );
      const available = pool.filter(
        (c) =>
          !taken.has(c.id) &&
          (!pass.variety || respectsVariety(c, counts)) &&
          (!pass.pricedOnly || c.costPerServingMillicents !== null),
      );
      if (available.length === 0) break;

      let pick: PlanCandidate | undefined;
      if (budget === null) {
        pick = available[0];
      } else {
        const slotsAfter = req.mealCount - entries.length - 1;
        const knownCosts = available
          .map(costFor)
          .filter((c): c is number => c !== null)
          .sort((a, b) => a - b);
        // Un plat est abordable s'il laisse de quoi compléter avec les plats les moins chers.
        pick = available.find((c) => {
          const cost = costFor(c);
          if (cost === null) return false;
          const others = knownCosts.slice();
          others.splice(others.indexOf(cost), 1);
          const reserve = others.slice(0, slotsAfter).reduce((s, v) => s + v, 0);
          return spent + cost + reserve <= budget;
        });
        // Sinon : le moins cher des plats chiffrés, puis seulement un plat non chiffré.
        pick ??= available
          .filter((c) => costFor(c) !== null)
          .sort((a, b) => costFor(a)! - costFor(b)! || a.id.localeCompare(b.id))[0];
        pick ??= available[0];
      }
      if (!pick) break;

      taken.add(pick.id);
      entries.push({ recipeId: pick.id, servings: req.people, locked: false });
      spent += costFor(pick) ?? 0;
    }
  }

  return summarize(entries, byId, req, budget);
}

function summarize(
  entries: PlanEntry[],
  byId: ReadonlyMap<string, PlanCandidate>,
  req: PlanRequest,
  budget: number | null,
): PlanResult {
  let known = 0;
  let unpriced = 0;
  for (const e of entries) {
    const c = byId.get(e.recipeId);
    const cost = entryCost(c, e.servings);
    if (cost === null || !c || c.missingPrices > 0) unpriced += 1;
    if (cost !== null) known += cost;
  }
  const status =
    entries.length < req.mealCount
      ? "not_enough_recipes"
      : budget !== null && known > budget
        ? "over_budget"
        : "ok";
  return { entries, knownMillicents: known, unpricedEntries: unpriced, status };
}

/**
 * Plats de remplacement pour la position `index` : compatibles (candidats), absents du menu,
 * respectant la variété, en privilégiant ceux qui tiennent dans le budget.
 */
export function suggestReplacements(
  candidates: readonly PlanCandidate[],
  entries: readonly PlanEntry[],
  index: number,
  {
    people,
    budgetCents,
    seed,
    limit = 3,
  }: { people: number; budgetCents: number | null; seed: number; limit?: number },
): string[] {
  const current = entries[index];
  if (!current) throw new DomainError("INVALID_PLAN", "Plat introuvable dans le menu.");
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const others = entries.filter((_, i) => i !== index);
  const counts = familyCounts(
    others.map((e) => e.recipeId),
    byId,
  );
  const inPlan = new Set(entries.map((e) => e.recipeId));
  const random = seededRandom(seed + index * 7919);
  const jitter = new Map(
    [...candidates].sort((a, b) => a.id.localeCompare(b.id)).map((c) => [c.id, random()]),
  );

  let othersCost = 0;
  for (const e of others) othersCost += entryCost(byId.get(e.recipeId), e.servings) ?? 0;
  const budget = budgetCents === null ? null : budgetCents * 1000;
  const fits = (c: PlanCandidate) => {
    if (budget === null) return true;
    const cost = entryCost(c, people);
    return cost !== null && othersCost + cost <= budget;
  };
  const score = (c: PlanCandidate) =>
    (fits(c) ? 100 : 0) +
    3 * Math.min(c.priorityUses, 3) +
    2 * c.stockCoverage +
    1.5 * (jitter.get(c.id) ?? 0);

  return candidates
    .filter((c) => !inPlan.has(c.id) && respectsVariety(c, counts))
    .sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map((c) => c.id);
}
