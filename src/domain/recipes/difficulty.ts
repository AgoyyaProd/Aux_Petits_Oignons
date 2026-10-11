/**
 * Difficulté d'une recette, calculée par une règle fixe (aucune donnée saisie à la main) :
 *  - Facile : préparation ≤ 15 min, au plus 4 étapes et 45 min au total ;
 *  - Élaborée : préparation ≥ 30 min, ou au moins 7 étapes, ou 2 h au total ou plus ;
 *  - Moyenne : tout le reste.
 * La règle est affichée à côté du libellé pour rester honnête sur son origine.
 */
export type Difficulty = "facile" | "moyenne" | "elaboree";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facile: "Facile",
  moyenne: "Moyenne",
  elaboree: "Élaborée",
};

export const DIFFICULTY_RULE =
  "Calculée selon le temps de préparation, le nombre d'étapes et la durée totale.";

export function recipeDifficulty(r: {
  prepMinutes: number;
  cookMinutes: number;
  steps: number;
}): Difficulty {
  const total = r.prepMinutes + r.cookMinutes;
  if (r.prepMinutes >= 30 || r.steps >= 7 || total >= 120) return "elaboree";
  if (r.prepMinutes <= 15 && r.steps <= 4 && total <= 45) return "facile";
  return "moyenne";
}
