import { describe, expect, it } from "vitest";
import {
  generatePlan,
  PACK_BONUS,
  packLeftover,
  packSynergy,
  randomReplacement,
  seededRandom,
  type PackInfo,
  type PlanCandidate,
} from "@/domain/planning";
import { packHint, wholePacks } from "@/domain/shopping";

function candidate(id: string, over: Partial<PlanCandidate> = {}): PlanCandidate {
  return {
    id,
    costPerServingMillicents: 200_000,
    missingPrices: 0,
    priorityUses: 0,
    stockCoverage: 0,
    varietyKeys: [],
    ...over,
  };
}

const COCO = "coco";
const HERBE = "persil";
const packages = new Map<string, PackInfo>([
  [COCO, { size: 400, keepDays: 3 }],
  [HERBE, { size: null, keepDays: null }],
]);

// Un curry pour 4 utilise 200 ml de lait de coco (50 ml/portion) : la boîte de 40 cl
// laisse 200 ml.
const curry = candidate("curry", { packUses: [{ ingredientId: COCO, perServing: 50 }] });
const dahl = candidate("dahl", { packUses: [{ ingredientId: COCO, perServing: 50 }] });

describe("packLeftover", () => {
  it("calcule le reste du dernier paquet entamé", () => {
    expect(packLeftover(200, 400)).toBe(200);
    expect(packLeftover(500, 400)).toBe(300);
  });
  it("ne compte pas de reste quand les paquets tombent juste (à 2 % près)", () => {
    expect(packLeftover(400, 400)).toBe(0);
    expect(packLeftover(395, 400)).toBe(0);
    expect(packLeftover(0, 400)).toBe(0);
  });
});

describe("packSynergy", () => {
  it("donne le bonus entier au plat qui finit le reste dans la fenêtre", () => {
    const placed = [{ candidate: curry, servings: 4, day: "2026-11-02" }];
    expect(packSynergy(dahl, 4, "2026-11-04", placed, packages)).toBe(PACK_BONUS);
  });

  it("donne une part du bonus si le plat ne finit qu'une partie du reste", () => {
    const placed = [{ candidate: curry, servings: 4, day: "2026-11-02" }];
    expect(packSynergy(dahl, 2, "2026-11-03", placed, packages)).toBeCloseTo(PACK_BONUS / 2);
  });

  it("aucun bonus hors de la conservation après ouverture", () => {
    const placed = [{ candidate: curry, servings: 4, day: "2026-11-02" }];
    expect(packSynergy(dahl, 4, "2026-11-06", placed, packages)).toBe(0);
  });

  it("aucun bonus si le premier plat tombe juste sur la boîte", () => {
    const placed = [{ candidate: curry, servings: 8, day: "2026-11-02" }];
    expect(packSynergy(dahl, 4, "2026-11-03", placed, packages)).toBe(0);
  });

  it("le plat le plus tôt dans la semaine est celui qui entame la boîte", () => {
    // Le dahl (2 portions, 100 ml, reste 300) passe avant le curry déjà placé (200 ml).
    const placed = [{ candidate: curry, servings: 4, day: "2026-11-04" }];
    expect(packSynergy(dahl, 2, "2026-11-02", placed, packages)).toBeCloseTo((PACK_BONUS * 2) / 3);
  });

  it("sans jour, la fenêtre est supposée respectée", () => {
    const placed = [{ candidate: curry, servings: 4 }];
    expect(packSynergy(dahl, 4, null, placed, packages)).toBe(PACK_BONUS);
  });

  it("une herbe fraîche sans format compte pour moitié, dans les 3 jours", () => {
    const a = candidate("taboule", { packUses: [{ ingredientId: HERBE, perServing: 5 }] });
    const b = candidate("omelette", { packUses: [{ ingredientId: HERBE, perServing: 3 }] });
    const placed = [{ candidate: a, servings: 4, day: "2026-11-02" }];
    expect(packSynergy(b, 4, "2026-11-05", placed, packages)).toBe(PACK_BONUS / 2);
    expect(packSynergy(b, 4, "2026-11-06", placed, packages)).toBe(0);
  });

  it("ignore un ingrédient sans format connu et le plat lui-même", () => {
    expect(packSynergy(curry, 4, null, [{ candidate: curry, servings: 4 }], packages)).toBe(0);
    const other = candidate("x", { packUses: [{ ingredientId: "inconnu", perServing: 10 }] });
    const placed = [{ candidate: other, servings: 4 }];
    expect(packSynergy(other, 4, null, placed, new Map())).toBe(0);
  });
});

describe("generatePlan avec les formats standards", () => {
  // Beaucoup de plats neutres : sans bonus, le dahl n'a qu'une petite chance d'être tiré.
  const neutral = Array.from({ length: 30 }, (_, i) =>
    candidate(`n-${String(i).padStart(2, "0")}`),
  );
  const pool = [...neutral, dahl];
  const base = { mealCount: 3, people: 4, budgetCents: null };

  function share(req: Partial<Parameters<typeof generatePlan>[1]>): number {
    let hits = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const plan = generatePlan([...pool, curry], {
        ...base,
        locked: [{ recipeId: "curry", servings: 4, day: "2026-11-02" }],
        seed,
        ...req,
      });
      if (plan.entries.some((e) => e.recipeId === "dahl")) hits++;
    }
    return hits / 300;
  }

  it("favorise une recette qui finit la boîte entamée dans la fenêtre", () => {
    const without = share({});
    const within = share({ packages, slotDays: ["2026-11-03", "2026-11-04"] });
    expect(within).toBeGreaterThan(without * 2);
  });

  it("ne favorise rien hors de la fenêtre de conservation", () => {
    const without = share({});
    const outside = share({ packages, slotDays: ["2026-11-07", "2026-11-08"] });
    expect(outside).toBeCloseTo(without, 1);
  });

  it("reste déterministe pour une graine donnée", () => {
    const req = {
      ...base,
      locked: [{ recipeId: "curry", servings: 4, day: "2026-11-02" }],
      packages,
      slotDays: ["2026-11-03", "2026-11-04"],
      seed: 42,
    };
    expect(generatePlan([...pool, curry], req)).toEqual(generatePlan([...pool, curry], req));
  });
});

describe("randomReplacement avec les formats standards", () => {
  it("le bouton « Changer » favorise aussi le plat qui finit la boîte", () => {
    const pool = [...Array.from({ length: 30 }, (_, i) => candidate(`n-${i}`)), dahl, curry];
    const entries = [
      { recipeId: "curry", servings: 4, locked: false, day: "2026-11-02", slot: "dinner" as const },
      { recipeId: "n-0", servings: 4, locked: false, day: "2026-11-03", slot: "dinner" as const },
    ];
    const count = (withPacks: boolean) => {
      let hits = 0;
      for (let seed = 1; seed <= 300; seed++) {
        const random = seededRandom(seed);
        const pick = randomReplacement(pool, entries, 1, {
          people: 4,
          budgetCents: null,
          random,
          ...(withPacks ? { packages } : {}),
        });
        if (pick === "dahl") hits++;
      }
      return hits;
    };
    expect(count(true)).toBeGreaterThan(count(false) * 2);
  });
});

describe("packHint (liste de courses)", () => {
  const coco = { size: 400, label: "boîte de 40 cl", dimension: "volume" as const };
  const q = (base: number, dimension: "mass" | "volume" | "count" = "volume") => ({
    milli: base * 1000,
    dimension,
  });

  it("indique le nombre de paquets à acheter, sans changer le besoin", () => {
    expect(packHint(q(100), coco)).toBe("1 boîte de 40 cl");
    expect(packHint(q(400), coco)).toBe("1 boîte de 40 cl");
    expect(packHint(q(600), coco)).toBe("2 × boîte de 40 cl");
  });

  it("rien sans format, sans achat ou dans une autre dimension (pas de conversion)", () => {
    expect(packHint(q(100), undefined)).toBeNull();
    expect(packHint(q(0), coco)).toBeNull();
    expect(packHint(q(100, "mass"), coco)).toBeNull();
  });
});

describe("wholePacks (coût à payer en magasin)", () => {
  const barquette = { size: 300, dimension: "mass" as const };
  const g = (base: number) => ({ milli: base * 1000, dimension: "mass" as const });

  it("arrondit au paquet entier supérieur", () => {
    expect(wholePacks(g(500), barquette)).toEqual({ count: 2, quantity: g(600) });
    expect(wholePacks(g(300), barquette)).toEqual({ count: 1, quantity: g(300) });
    expect(wholePacks(g(0.001), barquette)).toEqual({ count: 1, quantity: g(300) });
  });

  it("formats décimaux (75 cl) sans erreur d'arrondi", () => {
    const bouteille = { size: 750, dimension: "volume" as const };
    expect(wholePacks({ milli: 1_500_000, dimension: "volume" }, bouteille)?.count).toBe(2);
    expect(wholePacks({ milli: 1_500_001, dimension: "volume" }, bouteille)?.count).toBe(3);
  });

  it("rien sans format, sans achat ou dans une autre dimension (pas de conversion)", () => {
    expect(wholePacks(g(500), undefined)).toBeNull();
    expect(wholePacks(g(0), barquette)).toBeNull();
    expect(wholePacks({ milli: 500_000, dimension: "volume" }, barquette)).toBeNull();
  });
});
