import { DomainError } from "../errors";
import { recipeSeason, seasonScore } from "@/domain/recipes/season";
import { MAX_PER_FAMILY } from "./variety";

/**
 * Générateur de menu : déterministe (même demande + même graine = même menu),
 * sans IA, sans prix inventé.
 *
 * Ordre des critères :
 *  1. les candidats sont déjà compatibles avec le foyer (filtrés en amont, contrôlés en base) ;
 *  2. budget : on ne choisit un plat que s'il laisse de quoi compléter le menu dans le budget ;
 *  3. anti-gaspillage : plats qui utilisent des produits à consommer en priorité, puis le stock ;
 *  4. variété : pas deux fois la même recette, au plus 2 plats par famille de féculent/protéine,
 *     et si possible aucun plat du menu de la semaine précédente ;
 *  5. tirage pondéré (reproductible par la graine) : chaque plat a des chances proportionnelles
 *     à son poids. Les préférences (favoris, produits à finir, saison, objectifs, protéines)
 *     augmentent les chances sans rien garantir ; un plat servi il y a 2 à 6 semaines, ou
 *     écarté récemment avec « Changer », a moins de chances ; au moins un plat jamais servi
 *     (« découverte ») quand c'est possible. Les plats « pas pour nous » ne sont jamais
 *     candidats, filtrés en amont.
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
  /** Recette marquée « on aime » par le foyer. */
  favorite?: boolean;
  /** Contient de la viande (hors poisson) : compte pour le style flexitarien. */
  hasMeat?: boolean;
  /** Nombre d'ingrédients obligatoires de type légumes, fruits ou légumineuses. */
  plantCount?: number;
  /** Contient du poisson ou des légumineuses (repère « manger mieux »). */
  fishOrPulses?: boolean;
  /** Jamais au menu du foyer (repère « découvrir »). */
  novel?: boolean;
  /** Durée totale, en minutes. */
  totalMinutes?: number;
  /** Identifiants (slug) des ingrédients obligatoires, pour la saisonnalité. */
  ingredientSlugs?: readonly string[];
  /** Protéines d'une portion, en grammes ; null ou absent si le calcul n'est pas fiable. */
  proteinPerServing?: number | null;
}

/**
 * Température du tirage : un écart de score de T × ln 2 (≈ 1,4) double les chances d'un plat.
 * Un favori (+2,5) a ainsi environ 3,5 fois plus de chances qu'un plat ordinaire.
 */
export const DRAW_TEMPERATURE = 2;

/**
 * Mémoire des menus : multiplicateur des chances d'un plat servi il y a n semaines.
 * La semaine précédente est évitée tant qu'il reste d'autres choix (passe « fraîche »).
 */
const HISTORY_FACTOR: Record<number, number> = { 2: 0.15, 3: 0.35, 4: 0.55, 5: 0.75, 6: 0.9 };

/** Un plat écarté avec « Changer » ces dernières semaines a moins de chances. */
export const SKIPPED_FACTOR = 0.4;

export function historyFactor(weeksAgo: number | undefined): number {
  if (weeksAgo === undefined) return 1;
  return HISTORY_FACTOR[weeksAgo] ?? (weeksAgo < 2 ? HISTORY_FACTOR[2]! : 1);
}

/** Bonus d'un plat selon l'objectif de protéines par part (0 sans objectif ou sans calcul). */
export function proteinBonus(c: PlanCandidate, targetG: number | null | undefined): number {
  if (!targetG || c.proteinPerServing === null || c.proteinPerServing === undefined) return 0;
  if (c.proteinPerServing >= targetG) return 2;
  if (c.proteinPerServing >= 0.8 * targetG) return 1;
  return 0;
}

/** Bonus ou malus de saison d'un candidat pour le mois du menu (0 sans mois connu). */
export function candidateSeasonScore(c: PlanCandidate, month: number | undefined): number {
  if (!month || !c.ingredientSlugs) return 0;
  return seasonScore(
    recipeSeason(
      c.ingredientSlugs.map((slug) => ({ slug, optional: false })),
      month,
    ),
  );
}

export type EatingStyle = "omnivore" | "flexitarien" | "pescetarien" | "vegetarien" | "vegetalien";
export type Objective =
  "manger_mieux" | "plus_legumes" | "decouvrir" | "moins_gaspiller" | "economiser" | "rapide";

export interface FoodProfile {
  style?: EatingStyle;
  objectives?: readonly Objective[];
  /** Objectif de protéines par part, en grammes (null : pas d'objectif). */
  proteinTargetG?: number | null;
}

/**
 * Bonus de score selon les objectifs du foyer (règles fixes, cumulables) :
 *  - moins gaspiller : produits à finir et stock pèsent davantage ;
 *  - plus de légumes : + par ingrédient végétal (jusqu'à 4) ;
 *  - manger mieux : + par ingrédient végétal, + poisson ou légumineuses ;
 *  - découvrir : + pour un plat jamais mis au menu ;
 *  - économiser : + pour les plats les moins chers par portion ;
 *  - rapide : + pour un plat prêt en 30 min (moins en 45 min).
 */
export function profileBonus(
  c: PlanCandidate,
  objectives: ReadonlySet<Objective>,
  maxCostPerServing: number,
): number {
  let bonus = 0;
  const plants = Math.min(c.plantCount ?? 0, 4);
  if (objectives.has("moins_gaspiller")) {
    bonus += 2 * Math.min(c.priorityUses, 3) + 1 * c.stockCoverage;
  }
  if (objectives.has("plus_legumes")) bonus += 0.6 * plants;
  if (objectives.has("manger_mieux")) bonus += 0.4 * plants + (c.fishOrPulses ? 1 : 0);
  if (objectives.has("decouvrir") && c.novel) bonus += 2.5;
  if (
    objectives.has("economiser") &&
    c.costPerServingMillicents !== null &&
    maxCostPerServing > 0
  ) {
    bonus += 2 * (1 - c.costPerServingMillicents / maxCostPerServing);
  }
  if (objectives.has("rapide") && c.totalMinutes !== undefined) {
    bonus += c.totalMinutes <= 30 ? 2 : c.totalMinutes <= 45 ? 1 : 0;
  }
  return bonus;
}

/** Flexitarien : au plus un plat sur trois avec de la viande (au moins un si demandé). */
export function flexitarianMeatCap(mealCount: number): number {
  return Math.max(1, Math.floor(mealCount / 3));
}

/** Bonus de score d'un favori : du même ordre qu'un ingrédient à consommer vite. */
export const FAVORITE_BONUS = 2.5;

export interface PlanRequest {
  mealCount: number;
  people: number;
  budgetCents: number | null;
  /** Plats gardés (verrouillés) : ils comptent dans le nombre de repas et le budget. */
  locked: readonly { recipeId: string; servings: number }[];
  /** Recettes à ne pas proposer (ex. retirées par l'utilisateur). */
  excludeRecipeIds?: readonly string[];
  /** Recettes du menu de la semaine précédente : évitées tant qu'il reste d'autres choix. */
  recentRecipeIds?: readonly string[];
  /** Semaines écoulées depuis le dernier menu de chaque recette (2 à 6 : moins de chances). */
  history?: Readonly<Record<string, number>>;
  /** Recettes écartées récemment avec « Changer » : moins de chances. */
  skippedRecipeIds?: readonly string[];
  /** Style et objectifs du foyer (préférences douces). */
  profile?: FoodProfile;
  /** Mois du menu (1 à 12) : les plats de saison sont favorisés, ceux hors saison écartés. */
  month?: number;
  seed: number;
}

export type MealSlot = "lunch" | "dinner";

export interface PlanEntry {
  recipeId: string;
  servings: number;
  locked: boolean;
  /** Jour du repas (AAAA-MM-JJ, dans la semaine du menu) ; absent = pas encore placé. */
  day?: string | null;
  /** Midi ou soir ; présent si et seulement si `day` l'est. */
  slot?: MealSlot | null;
  /**
   * Reste d'un plat cuisiné en double plus tôt dans la semaine : ne compte ni dans les
   * courses ni dans le coût, et ne se cuisine pas.
   */
  leftover?: boolean;
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

/**
 * Poids de tirage de chaque candidat : exp(préférences / T) × mémoire des menus × plats
 * écartés. Toujours strictement positif : aucun plat compatible n'est impossible.
 */
export function drawWeights(
  candidates: readonly PlanCandidate[],
  req: Pick<PlanRequest, "profile" | "month" | "history" | "skippedRecipeIds">,
): Map<string, number> {
  const objectives = new Set(req.profile?.objectives ?? []);
  const maxCost = Math.max(0, ...candidates.map((c) => c.costPerServingMillicents ?? 0));
  const skipped = new Set(req.skippedRecipeIds ?? []);
  const target = req.profile?.proteinTargetG ?? null;
  return new Map(
    candidates.map((c) => {
      const preference =
        3 * Math.min(c.priorityUses, 3) +
        2 * c.stockCoverage +
        (c.favorite ? FAVORITE_BONUS : 0) +
        profileBonus(c, objectives, maxCost) +
        candidateSeasonScore(c, req.month) +
        proteinBonus(c, target);
      const memory = historyFactor(req.history?.[c.id]) * (skipped.has(c.id) ? SKIPPED_FACTOR : 1);
      return [c.id, Math.exp(preference / DRAW_TEMPERATURE) * memory];
    }),
  );
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
  const weight = drawWeights(candidates, req);
  // Tirage pondéré sans remise (astuce de Gumbel) : clé = log(poids) + bruit de Gumbel ; trier
  // par clé revient à tirer les plats un à un, chacun avec une chance proportionnelle à son
  // poids. Bruit tiré dans l'ordre stable des identifiants : le résultat ne dépend que de la
  // graine, pas de l'ordre reçu.
  const random = seededRandom(req.seed);
  const key = new Map(
    [...candidates]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((c) => {
        const u = Math.min(Math.max(random(), 1e-12), 1 - 1e-12);
        return [c.id, Math.log(weight.get(c.id) ?? 1) - Math.log(-Math.log(u))];
      }),
  );
  const score = (c: PlanCandidate) => key.get(c.id) ?? 0;
  const recent = new Set(req.recentRecipeIds ?? []);
  const flexi = req.profile?.style === "flexitarien";
  const meatCap = flexitarianMeatCap(req.mealCount);

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
  // Découverte : au moins un plat jamais servi parmi les nouveaux plats, s'il y en a un qui
  // convient (et qu'il reste au moins deux repas à remplir).
  let needNovel =
    req.mealCount - entries.length >= 2 &&
    !entries.some((e) => byId.get(e.recipeId)?.novel) &&
    pool.some((c) => c.novel);

  const costFor = (c: PlanCandidate) => entryCost(c, req.people);
  // Un plat est abordable s'il laisse de quoi compléter avec les plats chiffrés les moins chers
  // encore disponibles (sans budget : toujours).
  const affordable = (c: PlanCandidate, filled: number, among: readonly PlanCandidate[]) => {
    if (budget === null) return true;
    const cost = costFor(c);
    if (cost === null) return false;
    const slotsAfter = req.mealCount - filled - 1;
    const others = among
      .filter((o) => o.id !== c.id)
      .map(costFor)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b)
      .slice(0, Math.max(0, slotsAfter));
    return spent + cost + others.reduce((s, v) => s + v, 0) <= budget;
  };

  // Passes successives, du plus exigeant au plus souple : on relâche d'abord la nouveauté
  // (plats récents), puis la variété ; avec un budget, un plat sans prix n'arrive qu'en dernier
  // (le budget prime sur la variété).
  const passes =
    budget === null
      ? [
          { fresh: true, variety: true, pricedOnly: false },
          { fresh: false, variety: true, pricedOnly: false },
          { fresh: false, variety: false, pricedOnly: false },
        ]
      : [
          { fresh: true, variety: true, pricedOnly: true },
          { fresh: false, variety: true, pricedOnly: true },
          { fresh: false, variety: false, pricedOnly: true },
          { fresh: false, variety: false, pricedOnly: false },
        ];
  // Flexitarien : la limite de plats avec viande tient dans toutes les passes sauf une
  // dernière passe de secours (mieux vaut un plat de viande qu'un repas vide).
  const allPasses = flexi
    ? [
        ...passes.map((p) => ({ ...p, meatCap: true })),
        { fresh: false, variety: false, pricedOnly: false, meatCap: false },
      ]
    : passes.map((p) => ({ ...p, meatCap: false }));
  for (const pass of allPasses) {
    while (entries.length < req.mealCount) {
      const counts = familyCounts(
        entries.map((e) => e.recipeId),
        byId,
      );
      const meatCount = entries.filter((e) => byId.get(e.recipeId)?.hasMeat).length;
      const available = pool.filter(
        (c) =>
          !taken.has(c.id) &&
          (!pass.meatCap || !c.hasMeat || meatCount < meatCap) &&
          (!pass.fresh || !recent.has(c.id)) &&
          (!pass.variety || respectsVariety(c, counts)) &&
          (!pass.pricedOnly || c.costPerServingMillicents !== null),
      );
      if (available.length === 0) break;

      let pick: PlanCandidate | undefined;
      if (needNovel) {
        needNovel = false;
        pick = available.find((c) => c.novel && affordable(c, entries.length, available));
      }
      if (pick) {
        // Découverte retenue ci-dessus.
      } else if (budget === null) {
        pick = available[0];
      } else {
        pick = available.find((c) => affordable(c, entries.length, available));
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
    recentRecipeIds = [],
    profile,
    month,
  }: {
    people: number;
    budgetCents: number | null;
    seed: number;
    limit?: number;
    recentRecipeIds?: readonly string[];
    profile?: FoodProfile;
    month?: number;
  },
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
  const recent = new Set(recentRecipeIds);
  const objectives = new Set(profile?.objectives ?? []);
  const maxCost = Math.max(0, ...candidates.map((c) => c.costPerServingMillicents ?? 0));
  const score = (c: PlanCandidate) =>
    (fits(c) ? 100 : 0) +
    profileBonus(c, objectives, maxCost) +
    (recent.has(c.id) ? 0 : 20) +
    3 * Math.min(c.priorityUses, 3) +
    2 * c.stockCoverage +
    (c.favorite ? FAVORITE_BONUS : 0) +
    candidateSeasonScore(c, month) +
    1.5 * (jitter.get(c.id) ?? 0);

  return candidates
    .filter((c) => !inPlan.has(c.id) && respectsVariety(c, counts))
    .sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map((c) => c.id);
}

/**
 * « Changer » : tire au hasard UN plat de remplacement compatible avec le foyer (les
 * candidats sont déjà filtrés : allergies, régimes, matériel, temps, « pas pour nous »).
 *
 * On évite les plats déjà au menu, ceux écartés pendant cette session (`rejected`) et ceux
 * qui casseraient la variété. Parmi eux, on préfère ceux qui tiennent dans le budget, n'ont
 * pas été servis récemment et sont de saison, s'il y en a assez pour que le tirage reste
 * varié ; sinon on élargit. Quand tout a été écarté, on repart de zéro (en évitant au moins
 * le plat actuel). Renvoie null s'il n'existe aucune autre recette compatible.
 * `random` est injectable pour les tests (Math.random par défaut).
 */
export function randomReplacement(
  candidates: readonly PlanCandidate[],
  entries: readonly PlanEntry[],
  index: number,
  {
    people,
    budgetCents,
    recentRecipeIds = [],
    rejected = [],
    month,
    profile,
    history,
    skippedRecipeIds,
    random = Math.random,
  }: {
    people: number;
    budgetCents: number | null;
    recentRecipeIds?: readonly string[];
    rejected?: readonly string[];
    month?: number;
    /** Préférences, mémoire des menus et plats écartés : pondèrent le tirage. */
    profile?: FoodProfile;
    history?: Readonly<Record<string, number>>;
    skippedRecipeIds?: readonly string[];
    random?: () => number;
  },
): string | null {
  const current = entries[index];
  if (!current) throw new DomainError("INVALID_PLAN", "Plat introuvable dans le menu.");
  const byId = new Map(candidates.map((c) => [c.id, c]));
  // Les restes du plat remplacé partent avec lui : ils ne comptent ni pour la variété ni
  // pour le budget.
  const others = entries.filter((e, i) => i !== index && e.recipeId !== current.recipeId);
  const counts = familyCounts(
    others.filter((e) => !e.leftover).map((e) => e.recipeId),
    byId,
  );
  const inPlan = new Set(entries.map((e) => e.recipeId));
  const skipped = new Set(rejected);
  const recent = new Set(recentRecipeIds);

  let othersCost = 0;
  for (const e of others)
    if (!e.leftover) othersCost += entryCost(byId.get(e.recipeId), e.servings) ?? 0;
  const budget = budgetCents === null ? null : budgetCents * 1000;
  const fits = (c: PlanCandidate) => {
    if (budget === null) return true;
    const cost = entryCost(c, people);
    return cost !== null && othersCost + cost <= budget;
  };

  const fresh = candidates.filter((c) => !inPlan.has(c.id) && !skipped.has(c.id));
  const tiers = [
    fresh.filter(
      (c) =>
        respectsVariety(c, counts) &&
        fits(c) &&
        !recent.has(c.id) &&
        candidateSeasonScore(c, month) >= 0,
    ),
    fresh.filter((c) => respectsVariety(c, counts) && fits(c)),
    fresh.filter((c) => respectsVariety(c, counts)),
    fresh,
  ];
  // Un palier trop petit rendrait le tirage répétitif : on en veut au moins 3 si possible.
  // Quand tout a été écarté, on repart de la liste complète, sans le plat actuel.
  const pool =
    tiers.find((t) => t.length >= 3) ??
    tiers.find((t) => t.length > 0) ??
    candidates.filter((c) => !inPlan.has(c.id));
  if (pool.length === 0) return null;
  // Tirage pondéré : à poids égaux, chaque plat a la même chance.
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  const weights = drawWeights(sorted, { profile, month, history, skippedRecipeIds });
  const total = sorted.reduce((s, c) => s + weights.get(c.id)!, 0);
  let target = random() * total;
  for (const c of sorted) {
    target -= weights.get(c.id)!;
    if (target < 0) return c.id;
  }
  return sorted[sorted.length - 1]!.id;
}
