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
