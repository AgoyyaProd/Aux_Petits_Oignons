/**
 * Difficulté d'une recette, calculée par une règle fixe (aucune donnée saisie à la main) :
 *  - Facile : préparation ≤ 15 min, au plus 8 étapes et 45 min au total ;
 *  - Élaborée : préparation ≥ 40 min, ou au moins 12 étapes ;
 *  - Moyenne : tout le reste.
 * Les étapes sont détaillées (une action par étape) : un plat simple en compte 6 à 8.
 * La cuisson longue (mijotage, four) ne rend pas une recette plus difficile : seul le travail
 * de préparation compte, temps de levée ou de repos compris.
 * La règle est affichée à côté du libellé pour rester honnête sur son origine.
 */
export type Difficulty = "facile" | "moyenne" | "elaboree";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facile: "Facile",
  moyenne: "Moyenne",
  elaboree: "Élaborée",
};

export const DIFFICULTY_RULE =
  "Calculée selon le temps de préparation et le nombre d'étapes ; une longue cuisson ne compte pas.";

export function recipeDifficulty(r: {
  prepMinutes: number;
  cookMinutes: number;
  steps: number;
}): Difficulty {
  const total = r.prepMinutes + r.cookMinutes;
  if (r.prepMinutes >= 40 || r.steps >= 12) return "elaboree";
  if (r.prepMinutes <= 15 && r.steps <= 8 && total <= 45) return "facile";
  return "moyenne";
}
