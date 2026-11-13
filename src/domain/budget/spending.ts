/**
 * Dépenses réelles d'une semaine, comparées aux estimations.
 *
 * Tout est en centimes entiers. Rien n'est deviné : une semaine sans dépense saisie n'a pas
 * de « payé » (null), jamais 0 €. La part non alimentaire est retirée avant toute
 * comparaison avec le budget alimentaire.
 */
export interface Expense {
  amountCents: number;
  nonFoodCents: number;
  /** Estimation figée à la fin des courses (à payer en magasin), sinon null. */
  estimatedStoreCents: number | null;
  /** Part de cette estimation destinée aux plats du menu, sinon null. */
  estimatedMealsCents: number | null;
  estimateIsMinimum: boolean;
}

export interface WeekSpending {
  /** Total payé, part non alimentaire comprise. */
  paidCents: number;
  nonFoodCents: number;
  /** Payé pour l'alimentaire : c'est lui qui se compare au budget. */
  foodCents: number;
  /**
   * D'où vient l'alimentaire payé, d'après les estimations figées à la fin des courses :
   *  - meals : achats prévus pour les plats du menu ;
   *  - pantry : reste des paquets entiers, qui part au garde-manger ;
   *  - other : tout le reste (achats hors liste, prix différents de l'estimation). Négatif si
   *    la caisse a coûté moins que prévu.
   * Null quand aucune dépense de la semaine n'a d'estimation figée.
   */
  breakdown: { meals: number; pantry: number; other: number; isMinimum: boolean } | null;
}

export function weekSpending(expenses: readonly Expense[]): WeekSpending | null {
  if (expenses.length === 0) return null;
  let paid = 0;
  let nonFood = 0;
  let meals = 0;
  let store = 0;
  let estimated = false;
  let isMinimum = false;
  for (const e of expenses) {
    paid += e.amountCents;
    nonFood += e.nonFoodCents;
    if (e.estimatedStoreCents !== null) {
      estimated = true;
      store += e.estimatedStoreCents;
      meals += e.estimatedMealsCents ?? 0;
      if (e.estimateIsMinimum) isMinimum = true;
    }
  }
  const food = paid - nonFood;
  return {
    paidCents: paid,
    nonFoodCents: nonFood,
    foodCents: food,
    breakdown: estimated ? { meals, pantry: store - meals, other: food - store, isMinimum } : null,
  };
}
