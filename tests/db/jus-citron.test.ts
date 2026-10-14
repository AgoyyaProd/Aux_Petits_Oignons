import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

const lines = async (slug: string) =>
  (
    await pool.query(
      `select r.slug from public.recipe_ingredients ri
       join public.ingredients i on i.id = ri.ingredient_id
       join public.recipes r on r.id = ri.recipe_id
       where i.slug = $1 order by r.slug`,
      [slug],
    )
  ).rows.map((r) => r.slug as string);

describe("jus de citron en volume", () => {
  it("les jus sont des ingrédients en volume, avec densité et nutrition", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.default_dimension, i.density_g_per_ml::float d, n.ciqual_code
       from public.ingredients i join public.ingredient_nutrition n on n.ingredient_id = i.id
       where i.slug like 'jus-citron%' order by i.slug`,
    );
    expect(rows).toEqual([
      { slug: "jus-citron", default_dimension: "volume", d: 1.03, ciqual_code: 2028 },
      { slug: "jus-citron-vert", default_dimension: "volume", d: 1.03, ciqual_code: 2031 },
    ]);
  });

  it("les recettes qui n'utilisent que le jus demandent du jus, en volume", async () => {
    expect(await lines("jus-citron")).toHaveLength(16);
    expect(await lines("jus-citron-vert")).toHaveLength(12);
    const { rows } = await pool.query(
      `select count(*)::int n from public.recipe_ingredients ri
       join public.ingredients i on i.id = ri.ingredient_id
       where i.slug like 'jus-citron%' and (ri.dimension <> 'volume' or ri.quantity_base <= 0)`,
    );
    expect(rows[0].n).toBe(0);
  });

  it("le citron frais reste pour le zeste, les rondelles et les quartiers", async () => {
    const fresh = await lines("citron");
    expect(fresh).toEqual(
      expect.arrayContaining([
        "farfalle-saumon-epinards",
        "papillotes-saumon-legumes",
        "poulet-citron-olives",
        "spaghetti-sardines-citron",
      ]),
    );
    expect(fresh).not.toContain("taboule");
    expect(await lines("citron-vert")).toEqual(["pad-thai-crevettes"]);
  });

  it("le pur jus en bouteille est reconnu à la saisie", async () => {
    const { rows } = await pool.query(
      `select i.slug from public.ingredient_aliases a join public.ingredients i on i.id = a.ingredient_id
       where a.alias_normalized = public.normalize_alias('citron en bouteille')`,
    );
    expect(rows).toEqual([{ slug: "jus-citron" }]);
  });
});
