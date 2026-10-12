import { describe, expect, it } from "vitest";
import catalog from "../../fixtures/catalog-steps.json";
import {
  formatCountdown,
  matchStepIngredients,
  normalizeText,
  parseStepTimers,
} from "@/domain/recipes/steps";

type Recipe = {
  slug: string;
  ingredients: { id: string; name: string; optional: boolean }[];
  steps: string[];
};
const recipes = catalog as Recipe[];

/** Étape (1-indexée) à laquelle un ingrédient est rattaché dans une recette du catalogue. */
function stepOf(slug: string, name: string) {
  const r = recipes.find((x) => x.slug === slug)!;
  const ing = r.ingredients.find((i) => i.name === name)!;
  return matchStepIngredients(r.steps, r.ingredients).findIndex((ids) => ids.includes(ing.id)) + 1;
}

describe("ingrédients des étapes", () => {
  it("normalise accents, ligatures et apostrophes", () => {
    expect(normalizeText("L'œuf à la crème")).toBe(" l oeuf a la creme ");
  });

  it("rattache un ingrédient à sa première mention, une seule fois", () => {
    const steps = [
      "Émincer l'oignon.",
      "Faire revenir l'oignon dans l'huile.",
      "Ajouter le reste d'huile.",
    ];
    const ings = [
      { id: "oignon", name: "Oignon" },
      { id: "huile", name: "Huile d'olive" },
    ];
    expect(matchStepIngredients(steps, ings)).toEqual([["oignon"], ["huile"], []]);
  });

  it("distingue les pommes et les pommes de terre", () => {
    expect(stepOf("cotes-porc-pommes", "Pomme de terre")).toBe(2);
    expect(stepOf("cotes-porc-pommes", "Pomme")).toBe(3);
  });

  it("préfère le nom le plus précis (huile de sésame, tomates cerises)", () => {
    expect(stepOf("boeuf-brocoli-saute", "Huile de tournesol")).toBe(6);
    expect(stepOf("boeuf-brocoli-saute", "Huile de sésame")).toBe(10);
    expect(stepOf("fusilli-pesto-poulet", "Tomate cerise")).toBe(4);
  });

  it("ne confond pas l'eau de la recette avec celle des casseroles", () => {
    expect(stepOf("lentilles-corail-dahl", "Eau")).toBe(6);
    expect(stepOf("porc-caramel", "Eau")).toBe(8);
    expect(stepOf("potee-chou-saucisses", "Eau")).toBe(5);
  });

  it("reconnaît les désignations courantes (le cube, la viande, saler)", () => {
    expect(stepOf("agneau-raisins-semoule", "Bouillon cube de volaille")).toBe(7);
    expect(stepOf("bolognaise", "Bœuf haché")).toBe(4);
    expect(stepOf("cabillaud-poireaux", "Sel")).toBe(5);
  });

  it("rattache chaque ingrédient du catalogue à une étape", () => {
    const missing: string[] = [];
    for (const r of recipes) {
      const matched = new Set(matchStepIngredients(r.steps, r.ingredients).flat());
      for (const i of r.ingredients) if (!matched.has(i.id)) missing.push(`${r.slug}: ${i.name}`);
    }
    expect(missing).toEqual([]);
  });
});

describe("minuteurs", () => {
  it("lit minutes, fourchettes, heures et secondes", () => {
    expect(parseStepTimers("Cuire 20 minutes à feu doux.")).toEqual([
      { seconds: 1200, label: "20 min" },
    ]);
    expect(parseStepTimers("Cuire 8 à 10 minutes (voir le paquet).")).toEqual([
      { seconds: 480, label: "8 à 10 min" },
    ]);
    expect(parseStepTimers("Laisser mijoter 1 h 15 à feu doux.")).toEqual([
      { seconds: 4500, label: "1 h 15" },
    ]);
    expect(parseStepTimers("Réfrigérer au moins 4 heures.")).toEqual([
      { seconds: 14400, label: "4 h" },
    ]);
    expect(parseStepTimers("Mélanger 30 secondes.")).toEqual([{ seconds: 30, label: "30 s" }]);
  });

  it("garde l'ordre du texte et ignore les températures", () => {
    expect(
      parseStepTimers("Dorer 5 minutes côté peau, puis 3 minutes de l'autre côté à 200 °C."),
    ).toEqual([
      { seconds: 300, label: "5 min" },
      { seconds: 180, label: "3 min" },
    ]);
    expect(parseStepTimers("Préchauffer le four à 180 °C.")).toEqual([]);
  });

  it("propose un minuteur sur une bonne partie des étapes du catalogue", () => {
    const all = recipes.flatMap((r) => r.steps.map((s) => parseStepTimers(s)));
    expect(all.filter((t) => t.length).length).toBeGreaterThan(400);
  });

  it("affiche le compte à rebours", () => {
    expect(formatCountdown(245)).toBe("4:05");
    expect(formatCountdown(3750)).toBe("1:02:30");
    expect(formatCountdown(-3)).toBe("0:00");
  });
});
