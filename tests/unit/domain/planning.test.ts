import { describe, expect, it } from "vitest";
import {
  generatePlan,
  isMainDish,
  suggestReplacements,
  varietyKeys,
  type PlanCandidate,
} from "@/domain/planning";

/** Coût par portion en euros -> millièmes de centime. */
const eur = (euros: number) => Math.round(euros * 100_000);

function candidate(id: string, over: Partial<PlanCandidate> = {}): PlanCandidate {
  return {
    id,
    costPerServingMillicents: eur(2),
    missingPrices: 0,
    priorityUses: 0,
    stockCoverage: 0,
    varietyKeys: [],
    ...over,
  };
}

const catalog: PlanCandidate[] = [
  candidate("a-pates-1", { varietyKeys: ["feculent:pates"], costPerServingMillicents: eur(1) }),
  candidate("b-pates-2", { varietyKeys: ["feculent:pates"], costPerServingMillicents: eur(1) }),
  candidate("c-pates-3", { varietyKeys: ["feculent:pates"], costPerServingMillicents: eur(1) }),
  candidate("d-riz", { varietyKeys: ["feculent:riz"], costPerServingMillicents: eur(2) }),
  candidate("e-poisson", { varietyKeys: ["proteine:poisson"], costPerServingMillicents: eur(5) }),
  candidate("f-boeuf", { varietyKeys: ["proteine:boeuf"], costPerServingMillicents: eur(6) }),
  candidate("g-soupe", { costPerServingMillicents: eur(1.5) }),
  candidate("h-sans-prix", { costPerServingMillicents: null }),
];

const base = { mealCount: 4, people: 2, budgetCents: null, locked: [], seed: 1 };

describe("générateur de menu", () => {
  it("est déterministe : même demande, même graine, même menu (quel que soit l'ordre reçu)", () => {
    const first = generatePlan(catalog, base);
    const second = generatePlan([...catalog].reverse(), base);
    expect(second).toEqual(first);
    expect(first.entries).toHaveLength(4);
  });

  it("une autre graine peut proposer un autre menu", () => {
    const menus = new Set(
      [1, 2, 3, 4, 5, 6].map((seed) =>
        generatePlan(catalog, { ...base, seed })
          .entries.map((e) => e.recipeId)
          .sort()
          .join(","),
      ),
    );
    expect(menus.size).toBeGreaterThan(1);
  });

  it("pas de doublon, et au plus 2 plats de la même famille", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const { entries } = generatePlan(catalog, { ...base, mealCount: 6, seed });
      const ids = entries.map((e) => e.recipeId);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.filter((id) => id.includes("pates")).length).toBeLessThanOrEqual(2);
    }
  });

  it("les portions suivent le nombre de personnes", () => {
    const { entries } = generatePlan(catalog, { ...base, people: 3 });
    expect(entries.every((e) => e.servings === 3 && !e.locked)).toBe(true);
  });

  it("respecte le budget quand c'est possible (coût de tout le menu)", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      // 4 repas × 2 personnes, 14 € : impossible avec le bœuf ou le poisson.
      const result = generatePlan(catalog, { ...base, budgetCents: 1400, seed });
      expect(result.status).toBe("ok");
      expect(result.knownMillicents).toBeLessThanOrEqual(1400 * 1000);
      expect(result.unpricedEntries).toBe(0);
    }
  });

  it("budget impossible : le menu le moins cher, signalé comme dépassant", () => {
    const result = generatePlan(catalog, { ...base, budgetCents: 500 });
    expect(result.status).toBe("over_budget");
    expect(result.entries.map((e) => e.recipeId)).not.toContain("f-boeuf");
  });

  it("un plat sans prix n'est choisi qu'en dernier recours quand il y a un budget", () => {
    const result = generatePlan(catalog, { ...base, mealCount: 7, budgetCents: 100_000 });
    const ids = result.entries.map((e) => e.recipeId);
    expect(ids).not.toContain("h-sans-prix");
    expect(result.unpricedEntries).toBe(0);
  });

  it("garde les plats verrouillés et les compte dans le budget", () => {
    const result = generatePlan(catalog, {
      ...base,
      budgetCents: 2000,
      locked: [{ recipeId: "f-boeuf", servings: 2 }],
    });
    expect(result.entries[0]).toEqual({ recipeId: "f-boeuf", servings: 2, locked: true });
    expect(result.entries).toHaveLength(4);
    expect(result.knownMillicents).toBeLessThanOrEqual(2000 * 1000);
  });

  it("privilégie les plats qui utilisent les produits à consommer en priorité", () => {
    const withPriority = catalog.map((c) => (c.id === "e-poisson" ? { ...c, priorityUses: 2 } : c));
    for (let seed = 0; seed < 10; seed += 1) {
      const { entries } = generatePlan(withPriority, { ...base, mealCount: 1, seed });
      expect(entries[0]!.recipeId).toBe("e-poisson");
    }
  });

  it("n'utilise pas les recettes exclues ; signale un catalogue trop petit", () => {
    const result = generatePlan(catalog.slice(0, 3), {
      ...base,
      mealCount: 4,
      excludeRecipeIds: ["a-pates-1"],
    });
    expect(result.entries.map((e) => e.recipeId).sort()).toEqual(["b-pates-2", "c-pates-3"]);
    expect(result.status).toBe("not_enough_recipes");
  });

  it("relâche la variété plutôt que de laisser un repas vide", () => {
    const onlyPasta = catalog.slice(0, 3);
    const result = generatePlan(onlyPasta, { ...base, mealCount: 3 });
    expect(result.entries).toHaveLength(3);
    expect(result.status).toBe("ok");
  });

  it("un plat au prix partiel compte son minimum connu et est signalé incomplet", () => {
    const partial = catalog.map((c) => (c.id === "g-soupe" ? { ...c, missingPrices: 1 } : c));
    const result = generatePlan(partial, {
      ...base,
      mealCount: 1,
      locked: [{ recipeId: "g-soupe", servings: 2 }],
    });
    expect(result.knownMillicents).toBe(eur(3));
    expect(result.unpricedEntries).toBe(1);
  });

  it("refuse les demandes invalides", () => {
    expect(() => generatePlan(catalog, { ...base, mealCount: 0 })).toThrow();
    expect(() => generatePlan(catalog, { ...base, people: 21 })).toThrow();
    expect(() =>
      generatePlan(catalog, {
        ...base,
        mealCount: 1,
        locked: [
          { recipeId: "d-riz", servings: 2 },
          { recipeId: "g-soupe", servings: 2 },
        ],
      }),
    ).toThrow();
  });
});

describe("remplacement d'un plat", () => {
  const entries = [
    { recipeId: "a-pates-1", servings: 2, locked: false },
    { recipeId: "b-pates-2", servings: 2, locked: false },
    { recipeId: "f-boeuf", servings: 2, locked: false },
  ];

  it("propose des plats absents du menu qui respectent la variété", () => {
    const ids = suggestReplacements(catalog, entries, 2, {
      people: 2,
      budgetCents: null,
      seed: 1,
      limit: 10,
    });
    expect(ids).not.toContain("a-pates-1");
    expect(ids).not.toContain("f-boeuf");
    // Déjà deux plats de pâtes ailleurs dans le menu.
    expect(ids).not.toContain("c-pates-3");
  });

  it("met d'abord ceux qui tiennent dans le budget", () => {
    // Autres plats : 2 × 1 € × 2 pers = 4 € ; budget 8 € -> il reste 4 € pour 2 portions.
    const ids = suggestReplacements(catalog, entries, 2, { people: 2, budgetCents: 800, seed: 3 });
    expect(ids).toHaveLength(3);
    expect(ids.slice(0, 2).sort()).toEqual(["d-riz", "g-soupe"]);
  });
});

describe("familles et types de plats", () => {
  it("déduit les familles des ingrédients", () => {
    expect(varietyKeys(["pates", "lardon", "oeuf", "parmesan"])).toEqual([
      "feculent:pates",
      "proteine:oeuf",
      "proteine:porc",
    ]);
  });

  it("un dessert ou un petit-déjeuner n'est pas un repas principal", () => {
    expect(isMainDish(["plat", "four"])).toBe(true);
    expect(isMainDish(["soupe"])).toBe(true);
    expect(isMainDish(["dessert", "four"])).toBe(false);
    expect(isMainDish(["petit-dejeuner", "dessert", "poele"])).toBe(false);
  });
});
