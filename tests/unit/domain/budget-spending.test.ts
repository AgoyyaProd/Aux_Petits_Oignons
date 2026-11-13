import { describe, expect, it } from "vitest";
import { weekSpending, type Expense } from "@/domain/budget/spending";

const e = (over: Partial<Expense>): Expense => ({
  amountCents: 0,
  nonFoodCents: 0,
  estimatedStoreCents: null,
  estimatedMealsCents: null,
  estimateIsMinimum: false,
  ...over,
});

describe("dépenses réelles d'une semaine", () => {
  it("sans dépense saisie : rien, pas 0 €", () => {
    expect(weekSpending([])).toBeNull();
  });

  it("découpe l'écart entre plats, garde-manger et autres achats", () => {
    // Exemple réel : menu ≈ 24,89 €, en magasin ≈ 33 € (paquets entiers), payé 40 €.
    const s = weekSpending([
      e({ amountCents: 4000, estimatedStoreCents: 3300, estimatedMealsCents: 2489 }),
    ]);
    expect(s).toEqual({
      paidCents: 4000,
      nonFoodCents: 0,
      foodCents: 4000,
      breakdown: { meals: 2489, pantry: 811, other: 700, isMinimum: false },
    });
    const b = s!.breakdown!;
    expect(b.meals + b.pantry + b.other).toBe(s!.foodCents);
  });

  it("retire la part non alimentaire avant de comparer", () => {
    const s = weekSpending([
      e({
        amountCents: 4500,
        nonFoodCents: 500,
        estimatedStoreCents: 3300,
        estimatedMealsCents: 2489,
      }),
    ])!;
    expect(s.foodCents).toBe(4000);
    expect(s.breakdown!.other).toBe(700);
  });

  it("additionne plusieurs passages en caisse ; un achat à part va dans « autres »", () => {
    const s = weekSpending([
      e({
        amountCents: 3000,
        estimatedStoreCents: 2800,
        estimatedMealsCents: 2000,
        estimateIsMinimum: true,
      }),
      e({ amountCents: 650 }),
    ])!;
    expect(s.paidCents).toBe(3650);
    expect(s.breakdown).toEqual({ meals: 2000, pantry: 800, other: 850, isMinimum: true });
  });

  it("moins cher que prévu : « autres » négatif", () => {
    const s = weekSpending([
      e({ amountCents: 2500, estimatedStoreCents: 2800, estimatedMealsCents: 2000 }),
    ])!;
    expect(s.breakdown!.other).toBe(-300);
  });

  it("sans estimation figée : pas de découpage inventé", () => {
    const s = weekSpending([e({ amountCents: 1200, nonFoodCents: 200 })])!;
    expect(s).toEqual({ paidCents: 1200, nonFoodCents: 200, foodCents: 1000, breakdown: null });
  });
});
