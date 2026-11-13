import { describe, expect, it } from "vitest";
import { parseExpense } from "@/domain/budget/expense-form";

const TODAY = "2026-11-13";

describe("saisie d'une dépense", () => {
  it("lit le total, la part non alimentaire, le magasin et la date", () => {
    expect(
      parseExpense(
        { amount: "39,85", nonFood: "4.5", store: " Leclerc ", spentOn: "2026-11-12" },
        TODAY,
      ),
    ).toEqual({
      ok: true,
      value: { amountCents: 3985, nonFoodCents: 450, storeLabel: "Leclerc", spentOn: "2026-11-12" },
    });
  });

  it("par défaut : aujourd'hui, rien de non alimentaire, magasin inconnu", () => {
    expect(parseExpense({ amount: "40 €" }, TODAY)).toEqual({
      ok: true,
      value: { amountCents: 4000, nonFoodCents: 0, storeLabel: null, spentOn: TODAY },
    });
  });

  it("refuse un montant illisible, nul ou trop grand", () => {
    for (const amount of ["", "abc", "0", "12,345", "10000,01"]) {
      expect(parseExpense({ amount }, TODAY)).toMatchObject({ ok: false, field: "amount" });
    }
  });

  it("refuse une part non alimentaire supérieure au total", () => {
    expect(parseExpense({ amount: "10", nonFood: "12" }, TODAY)).toMatchObject({
      ok: false,
      field: "nonFood",
    });
  });

  it("refuse une date dans le futur ou invalide", () => {
    expect(parseExpense({ amount: "10", spentOn: "2026-11-14" }, TODAY)).toMatchObject({
      ok: false,
      field: "spentOn",
    });
    expect(parseExpense({ amount: "10", spentOn: "13/11/2026" }, TODAY)).toMatchObject({
      ok: false,
      field: "spentOn",
    });
  });
});
