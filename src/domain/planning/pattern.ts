import type { PlanEntry } from "./generate";
import {
  compareBySlot,
  fillOrder,
  isPlannedSlot,
  slotKey,
  weekSlots,
  WEEKDAY_CODES,
  type MealPattern,
  type PatternSlot,
  type SlotRef,
} from "./schedule";

/**
 * Semaine type du foyer : les repas prévus au menu (midi et/ou soir, jour par jour) et le
 * nombre de repas couverts par une cuisson. Un repas « pas prévu » (cantine, restaurant…)
 * ne reçoit pas de plat automatiquement ; on peut toujours y placer un plat à la main.
 */

export const ALL_PATTERN_SLOTS: readonly PatternSlot[] = WEEKDAY_CODES.flatMap((d) => [
  `${d}:lunch` as const,
  `${d}:dinner` as const,
]);

export const MAX_MEALS_PER_COOK = 3;

export const DEFAULT_PATTERN: MealPattern = {
  slots: new Set(ALL_PATTERN_SLOTS),
  mealsPerCook: 1,
};

export const PATTERN_PRESETS = {
  midi_et_soir: ALL_PATTERN_SLOTS,
  soir: WEEKDAY_CODES.map((d) => `${d}:dinner` as const),
  semaine_soir: WEEKDAY_CODES.flatMap((d) =>
    d === "sat" || d === "sun"
      ? [`${d}:lunch` as const, `${d}:dinner` as const]
      : [`${d}:dinner` as const],
  ),
} as const satisfies Record<string, readonly PatternSlot[]>;

export function isPatternSlot(value: string): value is PatternSlot {
  return (ALL_PATTERN_SLOTS as readonly string[]).includes(value);
}

/** Lit la semaine type stockée ; valeurs inconnues ignorées, semaine complète si rien d'utile. */
export function toPattern(
  slots: readonly string[] | null | undefined,
  mealsPerCook?: number | null,
): MealPattern {
  const valid = (slots ?? []).filter(isPatternSlot);
  const n = Math.trunc(mealsPerCook ?? 1);
  return {
    slots: valid.length ? new Set(valid) : new Set(ALL_PATTERN_SLOTS),
    mealsPerCook: n >= 1 && n <= MAX_MEALS_PER_COOK ? n : 1,
  };
}

/** Les repas prévus de la semaine, dans l'ordre chronologique. */
export function plannedSlots(weekStart: string, pattern?: MealPattern): SlotRef[] {
  return weekSlots(weekStart).filter((s) => isPlannedSlot(s, weekStart, pattern));
}

/** Un lot : les repas couverts par une même cuisson ; null = repas sans case libre. */
export type BatchGroup = readonly (SlotRef | null)[];

/**
 * Découpe les repas à couvrir en lots de `mealsPerCook` repas.
 *
 * Les repas retenus sont les `meals` premiers repas prévus libres dans l'ordre habituel (soirs
 * d'abord, à partir de `from`), remis dans l'ordre chronologique. Un lot ne déborde jamais des
 * jours à venir sur les jours déjà passés : un reste n'est jamais placé avant son plat.
 * Les repas sans case libre complètent le dernier lot, sans jour. Déterministe.
 */
export function batchGroups(
  kept: readonly PlanEntry[],
  meals: number,
  weekStart: string,
  from: string,
  pattern: MealPattern = DEFAULT_PATTERN,
): BatchGroup[] {
  const n = Math.max(1, Math.min(MAX_MEALS_PER_COOK, pattern.mealsPerCook));
  const total = Math.max(0, meals);
  const taken = new Set(
    kept.flatMap((e) => (e.day && e.slot ? [slotKey({ day: e.day, slot: e.slot })] : [])),
  );
  const start = from < weekStart ? weekStart : from;
  const chosen = fillOrder(weekStart, from, pattern)
    .filter((s) => !taken.has(slotKey(s)))
    .slice(0, total);
  const upcoming: (SlotRef | null)[] = chosen.filter((s) => s.day >= start).sort(compareBySlot);
  const past: (SlotRef | null)[] = chosen.filter((s) => s.day < start).sort(compareBySlot);
  // Repas sans case libre : à la suite du dernier segment (un reste sans jour reste après).
  const unplaced = Array.from({ length: total - chosen.length }, () => null);
  (past.length ? past : upcoming).push(...unplaced);
  const chunk = (list: readonly (SlotRef | null)[]): (SlotRef | null)[][] =>
    Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));
  return [...chunk(upcoming), ...chunk(past)];
}

/**
 * Place un plat par lot : il est cuisiné au premier repas du lot, pour tous les repas du lot
 * (`people` portions par repas), et ses restes occupent les repas suivants du lot.
 * Les plats gardés (`kept`) ne bougent pas. Les lots sans recette sont ignorés.
 */
export function placeBatches(
  kept: readonly PlanEntry[],
  recipes: readonly string[],
  groups: readonly BatchGroup[],
  people: number,
): PlanEntry[] {
  const out: PlanEntry[] = kept.map((e) => ({ ...e }));
  groups.forEach((group, i) => {
    const recipeId = recipes[i];
    if (!recipeId || group.length === 0) return;
    out.push({
      recipeId,
      servings: Math.min(40, people * group.length),
      locked: false,
      day: group[0]?.day ?? null,
      slot: group[0]?.slot ?? null,
    });
    for (const ref of group.slice(1)) {
      out.push({
        recipeId,
        servings: people,
        locked: false,
        leftover: true,
        day: ref?.day ?? null,
        slot: ref?.slot ?? null,
      });
    }
  });
  return out;
}

/** Nombre de plats à cuisiner pour couvrir `meals` repas. */
export function cooksFor(meals: number, mealsPerCook: number): number {
  return Math.ceil(Math.max(0, meals) / Math.max(1, mealsPerCook));
}
