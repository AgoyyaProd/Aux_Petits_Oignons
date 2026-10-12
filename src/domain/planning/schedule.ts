import type { MealSlot, PlanEntry } from "./generate";

export const WEEKDAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

/** Code d'un repas de la semaine type : « mon:lunch », « sun:dinner »… */
export type PatternSlot = `${WeekdayCode}:${MealSlot}`;

/** Semaine type du foyer (voir pattern.ts). */
export interface MealPattern {
  /** Repas prévus au menu ; jamais vide. */
  slots: ReadonlySet<string>;
  /** Repas couverts par une cuisson (1 à 3). */
  mealsPerCook: number;
}

/** Une case du planning : un jour de la semaine et un repas. */
export interface SlotRef {
  day: string;
  slot: MealSlot;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Les 7 jours de la semaine (lundi → dimanche). */
export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** Les 14 cases de la semaine, dans l'ordre chronologique (lundi midi, lundi soir, …). */
export function weekSlots(weekStart: string): SlotRef[] {
  return weekDays(weekStart).flatMap((day) => [
    { day, slot: "lunch" as const },
    { day, slot: "dinner" as const },
  ]);
}

/** Code de semaine type d'une case datée (la semaine commence le lundi `weekStart`). */
export function patternSlotOf(ref: SlotRef, weekStart: string): PatternSlot | null {
  const index = weekDays(weekStart).indexOf(ref.day);
  return index < 0 ? null : (`${WEEKDAY_CODES[index]!}:${ref.slot}` as PatternSlot);
}

/** La case est-elle un repas prévu au menu ? Sans semaine type, toutes le sont. */
export function isPlannedSlot(ref: SlotRef, weekStart: string, pattern?: MealPattern): boolean {
  if (!pattern) return true;
  const code = patternSlotOf(ref, weekStart);
  return code !== null && pattern.slots.has(code);
}

export function slotKey(ref: SlotRef): string {
  return `${ref.day}:${ref.slot}`;
}

/** Lit « AAAA-MM-JJ:lunch|dinner » ; null si la valeur n'est pas une case de la semaine. */
export function parseSlotKey(value: string, weekStart: string): SlotRef | null {
  return weekSlots(weekStart).find((s) => slotKey(s) === value) ?? null;
}

/**
 * Ordre de remplissage automatique : d'abord les soirs à partir de `from` (aujourd'hui pour la
 * semaine en cours, sinon le lundi), puis les midis à partir de `from`, puis les jours déjà
 * passés. Avec une semaine type, seuls les repas prévus. Déterministe.
 */
export function fillOrder(weekStart: string, from: string, pattern?: MealPattern): SlotRef[] {
  const days = weekDays(weekStart);
  const start = from < weekStart ? weekStart : from;
  const upcoming = days.filter((d) => d >= start);
  const past = days.filter((d) => d < start);
  return [
    ...upcoming.map((day) => ({ day, slot: "dinner" as const })),
    ...upcoming.map((day) => ({ day, slot: "lunch" as const })),
    ...past.map((day) => ({ day, slot: "dinner" as const })),
    ...past.map((day) => ({ day, slot: "lunch" as const })),
  ].filter((s) => isPlannedSlot(s, weekStart, pattern));
}

/**
 * Place les plats sans jour dans les cases libres, sans toucher aux plats déjà placés.
 * Un plat dont le jour n'est plus dans la semaine est considéré comme non placé.
 * S'il n'y a plus de case libre (parmi les repas prévus), le plat reste sans jour.
 */
export function autoPlace<T extends PlanEntry>(
  entries: readonly T[],
  weekStart: string,
  from: string,
  pattern?: MealPattern,
): T[] {
  const valid = new Set(weekSlots(weekStart).map(slotKey));
  const taken = new Set<string>();
  const out = entries.map((e) => {
    if (e.day && e.slot && valid.has(slotKey({ day: e.day, slot: e.slot }))) {
      taken.add(slotKey({ day: e.day, slot: e.slot }));
      return { ...e };
    }
    return { ...e, day: null, slot: null };
  });
  const free = fillOrder(weekStart, from, pattern).filter((s) => !taken.has(slotKey(s)));
  let next = 0;
  for (const e of out) {
    if (e.day) continue;
    const ref = free[next++];
    if (!ref) break;
    e.day = ref.day;
    e.slot = ref.slot;
  }
  return out;
}

/** Tri d'affichage : par jour puis midi avant soir ; les plats non placés à la fin. */
export function compareBySlot(
  a: Pick<PlanEntry, "day" | "slot">,
  b: Pick<PlanEntry, "day" | "slot">,
): number {
  if (!a.day || !b.day) return a.day ? -1 : b.day ? 1 : 0;
  if (a.day !== b.day) return a.day < b.day ? -1 : 1;
  if (a.slot === b.slot) return 0;
  return a.slot === "lunch" ? -1 : 1;
}

/**
 * Date à retenir pour les besoins d'un plat (DLC) : son jour s'il est placé, sinon aujourd'hui.
 * Un plat d'un jour passé mais pas encore cuisiné sera cuisiné au plus tôt aujourd'hui.
 * Toujours ramenée dans la semaine du menu.
 */
export function mealDateFor(
  day: string | null | undefined,
  weekStart: string,
  today: string,
): string {
  const weekEnd = addDays(weekStart, 6);
  let date = day ?? today;
  if (date < today && today <= weekEnd) date = today;
  if (date < weekStart) return weekStart;
  if (date > weekEnd) return weekEnd;
  return date;
}
