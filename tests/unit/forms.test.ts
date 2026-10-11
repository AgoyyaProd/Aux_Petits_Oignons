import { describe, expect, it } from "vitest";
import {
  formatRecipeQuantity,
  formatStockQuantity,
  unitsForDimension,
} from "@/lib/format-quantity";
import { householdSettingsSchema } from "@/server/modules/households/schema";
import { addItemSchema, echoValues, movementSchema } from "@/server/modules/pantry/schema";

const UUID = "7d1f2c3a-1b2c-4d5e-8f90-123456789abc";
const KEY = "0b6a6b7e-9c1d-4e2f-a3b4-c5d6e7f80912";

describe("ajout au garde-manger", () => {
  const base = {
    householdId: UUID,
    idempotencyKey: KEY,
    ingredient: " Riz ",
    location: "pantry",
    unit: "kg",
  };

  it("accepte une quantité décimale française et la garde dans son unité", () => {
    const parsed = addItemSchema.parse({ ...base, quantity: "1,5" });
    expect(parsed).toMatchObject({ ingredient: "Riz", quantity: 1.5, unit: "kg", opened: false });
  });

  it("une quantité vide signifie « inconnue » (null), jamais zéro", () => {
    expect(addItemSchema.parse({ ...base, quantity: "" }).quantity).toBeNull();
    expect(addItemSchema.safeParse({ ...base, quantity: "0" }).success).toBe(false);
  });

  it("une date sans type devient une DLC ; pas de date, pas de type", () => {
    expect(addItemSchema.parse({ ...base, expiresOn: "2026-10-20" }).expiryKind).toBe("use_by");
    expect(
      addItemSchema.parse({ ...base, expiresOn: "2026-10-20", expiryKind: "best_before" })
        .expiryKind,
    ).toBe("best_before");
    expect(addItemSchema.parse({ ...base, expiryKind: "best_before" }).expiryKind).toBeNull();
  });

  it.each([
    ["unité inconnue", { unit: "oz" }],
    ["emplacement inconnu", { location: "cave" }],
    ["date invalide", { expiresOn: "2026-13-45" }],
    ["clé absente", { idempotencyKey: "" }],
    ["ingrédient vide", { ingredient: "  " }],
  ])("refuse : %s", (_label, override) => {
    expect(addItemSchema.safeParse({ ...base, ...override }).success).toBe(false);
  });
});

describe("mouvements de stock", () => {
  const base = { itemId: UUID, idempotencyKey: KEY, expectedVersion: "3", unit: "g" };

  it("consommation : quantité strictement positive", () => {
    expect(movementSchema.parse({ ...base, kind: "consumption", quantity: "200" })).toMatchObject({
      kind: "consumption",
      quantity: 200,
      expectedVersion: 3,
    });
    expect(movementSchema.safeParse({ ...base, kind: "consumption", quantity: "0" }).success).toBe(
      false,
    );
  });

  it("correction : zéro est accepté (stock épuisé)", () => {
    expect(movementSchema.parse({ ...base, kind: "correction", quantity: "0" }).quantity).toBe(0);
    expect(movementSchema.parse({ ...base, kind: "correction", quantity: "0,0" }).quantity).toBe(0);
  });

  it("jeter : devient une perte totale sans quantité", () => {
    expect(movementSchema.parse({ ...base, kind: "discard" })).toMatchObject({
      kind: "loss",
      quantity: null,
    });
  });

  it("signale l'erreur sur le champ quantité", () => {
    const result = movementSchema.safeParse({ ...base, kind: "consumption", quantity: "beaucoup" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["quantity"]);
  });

  it("ne renvoie jamais la clé d'idempotence dans les valeurs réaffichées", () => {
    const fd = new FormData();
    fd.set("quantity", "2");
    fd.set("idempotencyKey", KEY);
    fd.set("$ACTION_ID_abc", "x");
    expect(echoValues(fd)).toEqual({ quantity: "2" });
  });
});

describe("réglages du foyer", () => {
  const base = { householdId: UUID, name: " Maison ", peopleCount: "3" };

  it("convertit budget et temps, champs facultatifs vides -> null", () => {
    expect(
      householdSettingsSchema.parse({ ...base, weeklyBudget: "85,50", maxPrepMinutes: "30" }),
    ).toEqual({
      householdId: UUID,
      name: "Maison",
      peopleCount: 3,
      weeklyBudget: 8550,
      maxPrepMinutes: 30,
    });
    expect(
      householdSettingsSchema.parse({ ...base, weeklyBudget: "", maxPrepMinutes: "" }),
    ).toMatchObject({ weeklyBudget: null, maxPrepMinutes: null });
  });

  it.each([
    ["0 personne", { peopleCount: "0" }],
    ["21 personnes", { peopleCount: "21" }],
    ["budget invalide", { weeklyBudget: "beaucoup" }],
    ["temps trop court", { maxPrepMinutes: "2" }],
    ["nom vide", { name: "   " }],
  ])("refuse : %s", (_label, override) => {
    expect(householdSettingsSchema.safeParse({ ...base, ...override }).success).toBe(false);
  });
});

describe("affichage des quantités en stock", () => {
  it("affiche dans l'unité de saisie", () => {
    expect(formatStockQuantity("1500.000", "mass", "kg")).toBe("1,5 kg");
    expect(formatStockQuantity("250.000", "volume", "cl")).toBe("25 cl");
    expect(formatStockQuantity("3.000", "count", "piece")).toBe("3 pièces");
    expect(formatStockQuantity("1.000", "count", "piece")).toBe("1 pièce");
  });

  it("gère les mouvements signés et la quantité inconnue", () => {
    expect(formatStockQuantity("-200.000", "mass", "g", { signed: true })).toBe("−200 g");
    expect(formatStockQuantity("500.000", "mass", "g", { signed: true })).toBe("+500 g");
    expect(formatStockQuantity(null, "mass", "g")).toBe("quantité inconnue");
  });

  it("retombe sur l'unité de base si l'unité d'affichage ne correspond pas", () => {
    expect(formatStockQuantity("500.000", "mass", "l")).toBe("500 g");
  });

  it("propose uniquement les unités de la dimension du produit", () => {
    expect(unitsForDimension("mass")).toEqual(["g", "kg"]);
    expect(unitsForDimension("count")).toEqual(["piece"]);
  });
});

describe("quantités de recette ajustées aux portions", () => {
  it("masses et volumes : valeur exacte, au dixième", () => {
    expect(formatRecipeQuantity("300", "g", 5, 4)).toBe("375 g");
    expect(formatRecipeQuantity("400", "ml", 5, 4)).toBe("500 ml");
    expect(formatRecipeQuantity("10", "g", 5, 4)).toBe("12,5 g");
  });

  it("pièces et cuillères : arrondi à la demi-unité, signalé par ≈", () => {
    expect(formatRecipeQuantity("3", "piece", 5, 4)).toBe("≈ 4 pièces"); // 3,75 œufs
    expect(formatRecipeQuantity("3", "tbsp", 5, 4)).toBe("≈ 4 c. à soupe");
    expect(formatRecipeQuantity("2", "piece", 5, 4)).toBe("2,5 pièces"); // exact
    expect(formatRecipeQuantity("4", "piece", 4, 4)).toBe("4 pièces");
  });

  it("jamais moins d'une demi-unité affichée", () => {
    expect(formatRecipeQuantity("1", "piece", 1, 6)).toBe("≈ 0,5 pièce");
  });
});
