import { describe, expect, it } from "vitest";
import { randomReplacement, type PlanCandidate, type PlanEntry } from "@/domain/planning";

const eur = (euros: number) => Math.round(euros * 100_000);
const c = (id: string, over: Partial<PlanCandidate> = {}): PlanCandidate => ({
  id,
  costPerServingMillicents: eur(2),
  missingPrices: 0,
  priorityUses: 0,
  stockCoverage: 0,
  varietyKeys: [],
  ...over,
});
const e = (recipeId: string, over: Partial<PlanEntry> = {}): PlanEntry => ({
  recipeId,
  servings: 2,
  locked: false,
  ...over,
});

const catalog = ["a", "b", "c", "d", "e", "f"].map((id) => c(id));
const opts = { people: 2, budgetCents: null };

/** Tire `n` fois avec un aléa qui parcourt [0, 1[ : renvoie l'ensemble des plats proposés. */
function draws(fn: (random: () => number) => string | null, n = 12) {
  return new Set(Array.from({ length: n }, (_, i) => fn(() => i / n)));
}

describe("changer un plat (tirage aléatoire)", () => {
  it("ne propose jamais un plat déjà au menu, ni le plat actuel", () => {
    const entries = [e("a"), e("b")];
    const got = draws((random) => randomReplacement(catalog, entries, 0, { ...opts, random }));
    expect(got).toEqual(new Set(["c", "d", "e", "f"]));
  });

  it("tire vraiment au hasard parmi les candidats (pas toujours le même)", () => {
    const got = draws((random) => randomReplacement(catalog, [e("a")], 0, { ...opts, random }));
    expect(got.size).toBeGreaterThan(3);
  });

  it("évite les plats écartés pendant la session, puis repart de zéro quand tout est écarté", () => {
    const rejected = ["b", "c", "d", "e"];
    expect(
      draws((random) => randomReplacement(catalog, [e("a")], 0, { ...opts, rejected, random })),
    ).toEqual(new Set(["f"]));
    const all = ["b", "c", "d", "e", "f"];
    const got = draws((random) =>
      randomReplacement(catalog, [e("a")], 0, { ...opts, rejected: all, random }),
    );
    expect(got.has("a")).toBe(false);
    expect(got.size).toBeGreaterThan(1);
  });

  it("préfère les plats qui tiennent dans le budget et pas servis récemment", () => {
    const cat = [
      c("a"),
      c("cher-1", { costPerServingMillicents: eur(20) }),
      c("cher-2", { costPerServingMillicents: eur(20) }),
      c("recent", { costPerServingMillicents: eur(1) }),
      c("ok-1", { costPerServingMillicents: eur(1) }),
      c("ok-2", { costPerServingMillicents: eur(1) }),
      c("ok-3", { costPerServingMillicents: eur(1) }),
    ];
    const got = draws((random) =>
      randomReplacement(cat, [e("a")], 0, {
        people: 2,
        budgetCents: 1000,
        recentRecipeIds: ["recent"],
        random,
      }),
    );
    expect(got).toEqual(new Set(["ok-1", "ok-2", "ok-3"]));
  });

  it("respecte la variété : pas une troisième fois des pâtes si on peut l'éviter", () => {
    const cat = [
      c("p1", { varietyKeys: ["feculent:pates"] }),
      c("p2", { varietyKeys: ["feculent:pates"] }),
      c("p3", { varietyKeys: ["feculent:pates"] }),
      c("r1", { varietyKeys: ["feculent:riz"] }),
      c("r2", { varietyKeys: ["feculent:riz"] }),
      c("s1"),
      c("x"),
    ];
    const got = draws((random) =>
      randomReplacement(cat, [e("x"), e("p1"), e("p2")], 0, { ...opts, random }),
    );
    expect(got.has("p3")).toBe(false);
  });

  it("le reste du plat remplacé ne compte pas ; null s'il n'y a aucune autre recette", () => {
    const entries = [e("a"), e("a", { leftover: true }), e("b")];
    const got = draws((random) => randomReplacement(catalog, entries, 0, { ...opts, random }));
    expect(got.has("a")).toBe(false);
    expect(got.has("b")).toBe(false);
    expect(randomReplacement([c("a")], [e("a")], 0, opts)).toBeNull();
  });
});

describe("changer un plat : tirage pondéré", () => {
  it("à préférences égales, chaque plat a la même chance", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 500; i += 1) {
      const id = randomReplacement(catalog, [e("a")], 0, { ...opts, random: () => i / 500 })!;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    expect([...counts.values()]).toEqual([100, 100, 100, 100, 100]);
  });

  it("l'objectif de protéines et les plats écartés pèsent sur le tirage", () => {
    const cat = [
      c("a"),
      c("riche", { proteinPerServing: 35 }),
      c("pauvre", { proteinPerServing: 10 }),
      c("ecarte", { proteinPerServing: 10 }),
    ];
    const counts = new Map<string, number>();
    for (let i = 0; i < 1000; i += 1) {
      const id = randomReplacement(cat, [e("a")], 0, {
        ...opts,
        profile: { proteinTargetG: 30 },
        skippedRecipeIds: ["ecarte"],
        random: () => i / 1000,
      })!;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    expect(counts.get("riche")!).toBeGreaterThan(2 * counts.get("pauvre")!);
    expect(counts.get("pauvre")!).toBeGreaterThan(counts.get("ecarte")!);
    expect(counts.get("ecarte")!).toBeGreaterThan(0);
  });
});
