import { describe, expect, it } from "vitest";
import { InvalidQuantityError } from "@/domain/errors";
import { centsToInput, formatCents, parseEurosToCents } from "@/domain/money";
import { comparePantryItems, daysBetween, expiryState, isPriority } from "@/domain/pantry/priority";
import { todayIn } from "@/lib/dates";

const TODAY = "2026-10-11";
const item = (
  expiresOn: string | null,
  expiryKind: "use_by" | "best_before" | null = expiresOn ? "use_by" : null,
  openedAt: string | null = null,
) => ({ expiresOn, expiryKind, openedAt });

describe("priorité de consommation (D8)", () => {
  it.each([
    ["DLC dans 3 jours", item("2026-10-14"), true],
    ["DLC aujourd'hui", item("2026-10-11"), true],
    ["DLC dépassée", item("2026-10-09"), true],
    ["DLC dans 4 jours", item("2026-10-15"), false],
    ["DDM dans 1 jour", item("2026-10-12", "best_before"), false],
    ["produit entamé sans date", item(null, null, "2026-10-01"), true],
    ["sans date, fermé", item(null), false],
  ])("%s -> %s", (_label, it_, expected) => {
    expect(isPriority(it_, TODAY)).toBe(expected);
  });

  it("décrit l'état de péremption", () => {
    expect(expiryState(item("2026-10-09"), TODAY)).toEqual({
      kind: "expired",
      days: 2,
      label: "DLC",
    });
    expect(expiryState(item("2026-10-13", "best_before"), TODAY)).toEqual({
      kind: "soon",
      days: 2,
      label: "DDM",
    });
    expect(expiryState(item(null), TODAY)).toEqual({ kind: "none" });
  });

  it("compte les jours sans être piégé par le changement d'heure", () => {
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2); // passage à l'heure d'hiver le 25
  });

  it("trie : priorités, puis date la plus proche, puis sans date", () => {
    const list = [item(null), item("2026-11-30"), item("2026-10-12"), item("2026-10-20")];
    const sorted = [...list].sort((a, b) => comparePantryItems(a, b, TODAY));
    expect(sorted.map((i) => i.expiresOn)).toEqual([
      "2026-10-12",
      "2026-10-20",
      "2026-11-30",
      null,
    ]);
  });
});

describe("montants", () => {
  it.each([
    ["85", 8500],
    ["85,5", 8550],
    ["85.50", 8550],
    ["1 200,00 €", 120000],
    ["0", 0],
  ])("« %s » -> %d centimes", (input, cents) => {
    expect(parseEurosToCents(input)).toBe(cents);
  });

  it.each(["-5", "abc", "1,234", ""])("refuse « %s »", (input) => {
    expect(() => parseEurosToCents(input)).toThrow(InvalidQuantityError);
  });

  it("formate et réaffiche", () => {
    expect(formatCents(8550).replace(/\s/g, " ")).toBe("85,50 €");
    expect(centsToInput(8500)).toBe("85");
    expect(centsToInput(8505)).toBe("85,05");
    expect(centsToInput(null)).toBe("");
  });
});

describe("date du jour du foyer", () => {
  it("dépend du fuseau, pas de l'heure du serveur", () => {
    const lateEvening = new Date("2026-10-11T22:30:00Z");
    expect(todayIn("Europe/Paris", lateEvening)).toBe("2026-10-12");
    expect(todayIn("America/Montreal", lateEvening)).toBe("2026-10-11");
  });
});
