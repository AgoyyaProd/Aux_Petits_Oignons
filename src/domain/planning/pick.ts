import { normalizeText } from "@/domain/recipes/compatibility";

export interface PickFilter {
  query: string;
  favoritesOnly?: boolean;
  maxMinutes?: number | null;
}

/**
 * Recherche d'un plat à choisir : chaque mot tapé doit se retrouver dans le titre ou les
 * étiquettes, sans tenir compte des accents ni des majuscules (« creme » trouve « Crème »).
 */
export function filterChoices<
  T extends { title: string; tags: readonly string[]; favorite: boolean; totalMinutes: number },
>(choices: readonly T[], { query, favoritesOnly = false, maxMinutes = null }: PickFilter): T[] {
  const words = normalizeText(query).split(" ").filter(Boolean);
  return choices.filter((c) => {
    if (favoritesOnly && !c.favorite) return false;
    if (maxMinutes !== null && c.totalMinutes > maxMinutes) return false;
    if (words.length === 0) return true;
    const haystack = normalizeText(`${c.title} ${c.tags.join(" ")}`);
    return words.every((w) => haystack.includes(w));
  });
}

/** Nom court du matériel, pour expliquer pourquoi une recette n'est pas proposée d'office. */
export const EQUIPMENT_SHORT: Readonly<Record<string, string>> = {
  plaques: "plaques de cuisson",
  four: "four",
  poele: "poêle",
  casserole: "casserole",
  faitout: "faitout",
  plat_four: "plat allant au four",
  plat_gratin: "plat à gratin",
  moule: "moule",
  mixeur: "mixeur",
  micro_ondes: "micro-ondes",
  airfryer: "friteuse sans huile",
};

export interface OffProfile {
  /** Matériel demandé par la recette et non coché par le foyer (codes). */
  missingEquipment: readonly string[];
  /** Aliments non souhaités présents dans la recette (noms). */
  avoidedNames: readonly string[];
  /** Préparation plus longue que le maximum du foyer. */
  tooLong: boolean;
}

/**
 * Pourquoi une recette n'est pas proposée d'office, en une ligne : elle reste choisissable par
 * la recherche (le foyer décide), contrairement aux allergies et aux régimes, jamais proposés.
 */
export function offProfileWarning({ missingEquipment, avoidedNames, tooLong }: OffProfile): string {
  const parts: string[] = [];
  if (missingEquipment.length) {
    parts.push(`Demande : ${missingEquipment.map((c) => EQUIPMENT_SHORT[c] ?? c).join(", ")}`);
  }
  if (avoidedNames.length) parts.push(`Contient : ${avoidedNames.join(", ")}`);
  if (tooLong) parts.push("Préparation plus longue que ton maximum");
  return parts.join(" · ");
}

/** Choix de la recherche : d'abord ceux qui conviennent, puis les autres, chacun par titre. */
export function orderChoices<T extends { title: string; warning: string | null }>(
  choices: readonly T[],
): T[] {
  return [...choices].sort(
    (a, b) =>
      Number(a.warning !== null) - Number(b.warning !== null) ||
      a.title.localeCompare(b.title, "fr"),
  );
}

/** En dessous de ce nombre de plats proposés d'office, le planificateur prévient le foyer. */
export const FEW_CANDIDATES = 60;

/**
 * Alerte quand les réglages du foyer laissent trop peu de plats au générateur (par exemple du
 * matériel décoché par erreur) ; null si le choix est suffisant ou si rien n'est en cause.
 */
export function catalogLimitMessage(
  candidateCount: number,
  limits: { equipment: number; ingredients: number; tooLong: number },
): string | null {
  if (candidateCount >= FEW_CANDIDATES) return null;
  const causes = [
    limits.equipment ? `le matériel coché en écarte ${limits.equipment}` : null,
    limits.ingredients ? `les aliments non souhaités ${limits.ingredients}` : null,
    limits.tooLong ? `le temps de préparation maximal ${limits.tooLong}` : null,
  ].filter((c): c is string => c !== null);
  if (!causes.length) return null;
  const plats = `${candidateCount} plat${candidateCount > 1 ? "s" : ""}`;
  const last = causes.pop()!;
  const list = causes.length ? `${causes.join(", ")} et ${last}` : last;
  const verbe = candidateCount > 1 ? "correspondent" : "correspond";
  return `Seulement ${plats} ${verbe} à tes réglages : ${list}.`;
}
