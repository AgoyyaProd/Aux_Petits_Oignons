import { normalizeText } from "@/domain/recipes/compatibility";

export interface IngredientChoice {
  name: string;
  /** Synonymes normalisés (« oeufs », « pdt », « farfalles »…). */
  aliases: string[];
}

/**
 * Recherche d'ingrédient insensible aux accents et à la casse, sur le nom et les synonymes :
 * « oeuf » trouve « Œuf », « farf » trouve « Farfalle », « pdt » trouve « Pomme de terre ».
 * Chaque mot saisi doit commencer un mot du nom ou d'un synonyme.
 */
export function searchIngredients(
  choices: readonly IngredientChoice[],
  query: string,
  limit = 8,
): string[] {
  const terms = normalizeText(query).split(" ").filter(Boolean);
  if (terms.length === 0) return [];
  const scored: { name: string; score: number }[] = [];
  for (const choice of choices) {
    const name = normalizeText(choice.name);
    const texts = [name, ...choice.aliases];
    const matches = texts.some((text) => {
      const words = text.split(" ");
      return terms.every((t) => words.some((w) => w.startsWith(t)));
    });
    if (!matches) continue;
    const q = terms.join(" ");
    const score =
      name === q ? 0 : name.startsWith(q) ? 1 : choice.aliases.some((a) => a.startsWith(q)) ? 2 : 3;
    scored.push({ name: choice.name, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, "fr"))
    .slice(0, limit)
    .map((s) => s.name);
}
