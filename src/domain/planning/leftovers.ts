import type { PlanEntry } from "./generate";
import { compareBySlot, slotKey, weekSlots, type SlotRef } from "./schedule";

/**
 * Restes et cuisine en avance.
 *
 * « Cuisiner double » : le plat cuisiné reçoit les portions du reste (les courses en tiennent
 * compte), et un reste de la même recette est placé au repas libre suivant. Le reste ne
 * compte ni dans les courses ni dans le coût, et ne se cuisine pas.
 */

/** Plat cuisiné dont dépend un reste : la première occurrence non-reste de la recette. */
export function sourceIndexOf(entries: readonly PlanEntry[], recipeId: string): number {
  return entries.findIndex((e) => e.recipeId === recipeId && !e.leftover);
}

/** Première case libre strictement après `after` dans la semaine ; null s'il n'y en a pas. */
export function nextFreeSlotAfter(
  entries: readonly PlanEntry[],
  weekStart: string,
  after: SlotRef,
): SlotRef | null {
  const taken = new Set(
    entries.flatMap((e) => (e.day && e.slot ? [slotKey({ day: e.day, slot: e.slot })] : [])),
  );
  const slots = weekSlots(weekStart);
  const from = slots.findIndex((s) => slotKey(s) === slotKey(after));
  return slots.slice(from + 1).find((s) => !taken.has(slotKey(s))) ?? null;
}

/**
 * Ajoute un reste du plat `index` pour `people` personnes. Le plat cuisiné et son reste sont
 * gardés (verrouillés) pour survivre à une nouvelle proposition de menu.
 */
export function addLeftover(
  entries: readonly PlanEntry[],
  index: number,
  people: number,
  weekStart: string,
): PlanEntry[] {
  const source = entries[index];
  if (!source || source.leftover) throw new Error("Seul un plat cuisiné peut avoir des restes.");
  const slot =
    source.day && source.slot
      ? nextFreeSlotAfter(entries, weekStart, { day: source.day, slot: source.slot })
      : null;
  const out = entries.map((e, i) =>
    i === index ? { ...e, servings: Math.min(40, e.servings + people), locked: true } : { ...e },
  );
  out.push({
    recipeId: source.recipeId,
    servings: people,
    locked: true,
    leftover: true,
    day: slot?.day ?? null,
    slot: slot?.slot ?? null,
  });
  return out;
}

/** Retire un plat ; retirer un reste rend ses portions au plat cuisiné. */
export function removeEntryWithLeftovers(
  entries: readonly PlanEntry[],
  index: number,
): PlanEntry[] {
  const removed = entries[index];
  const out = entries.filter((_, i) => i !== index).map((e) => ({ ...e }));
  if (removed?.leftover) {
    const src = sourceIndexOf(out, removed.recipeId);
    if (src >= 0) out[src]!.servings = Math.max(1, out[src]!.servings - removed.servings);
  }
  return normalizeLeftovers(out);
}

/**
 * Cohérence des restes après toute modification du menu :
 *  - un reste sans plat cuisiné de la même recette redevient un plat normal (ses ingrédients
 *    comptent alors dans les courses : jamais d'achat oublié) ;
 *  - si `weekStart` est fourni, un reste placé avant (ou au même repas que) son plat cuisiné
 *    est déplacé au repas libre suivant, ou laissé sans jour s'il n'y en a pas.
 */
export function normalizeLeftovers(entries: readonly PlanEntry[], weekStart?: string): PlanEntry[] {
  const out = entries.map((e) =>
    e.leftover && sourceIndexOf(entries, e.recipeId) < 0 ? { ...e, leftover: false } : { ...e },
  );
  if (!weekStart) return out;
  out.forEach((e, i) => {
    if (!e.leftover || !e.day || !e.slot) return;
    const src = out[sourceIndexOf(out, e.recipeId)]!;
    if (!src.day || !src.slot || compareBySlot(e, src) > 0) return;
    const others = out.filter((_, j) => j !== i);
    const next = nextFreeSlotAfter(others, weekStart, { day: src.day, slot: src.slot });
    e.day = next?.day ?? null;
    e.slot = next?.slot ?? null;
  });
  return out;
}
