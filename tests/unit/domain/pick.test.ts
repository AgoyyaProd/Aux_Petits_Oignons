import { describe, expect, it } from "vitest";
import { filterChoices } from "@/domain/planning/pick";

const choices = [
  { id: "a", title: "Crème de potiron", tags: ["soupe"], favorite: false, totalMinutes: 40 },
  { id: "b", title: "Poulet basquaise", tags: ["plat"], favorite: true, totalMinutes: 55 },
  {
    id: "c",
    title: "Curry de pois chiches",
    tags: ["végétarien"],
    favorite: false,
    totalMinutes: 30,
  },
  { id: "d", title: "Poulet coco express", tags: ["rapide"], favorite: false, totalMinutes: 20 },
];
const ids = (r: { id: string }[]) => r.map((c) => c.id);

describe("recherche d'un plat à choisir", () => {
  it("sans recherche ni filtre : tout", () => {
    expect(ids(filterChoices(choices, { query: "" }))).toEqual(["a", "b", "c", "d"]);
  });

  it("ignore accents et majuscules, cherche aussi dans les étiquettes", () => {
    expect(ids(filterChoices(choices, { query: "CREME" }))).toEqual(["a"]);
    expect(ids(filterChoices(choices, { query: "vegetarien" }))).toEqual(["c"]);
  });

  it("tous les mots doivent correspondre", () => {
    expect(ids(filterChoices(choices, { query: "poulet coco" }))).toEqual(["d"]);
    expect(ids(filterChoices(choices, { query: "poulet" }))).toEqual(["b", "d"]);
  });

  it("filtres favoris et durée maximale", () => {
    expect(ids(filterChoices(choices, { query: "", favoritesOnly: true }))).toEqual(["b"]);
    expect(ids(filterChoices(choices, { query: "", maxMinutes: 30 }))).toEqual(["c", "d"]);
  });
});
