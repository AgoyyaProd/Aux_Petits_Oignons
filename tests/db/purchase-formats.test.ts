import { describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool } from "./helpers";

/** Formats d'achat (0083) : contenances Open Prices, lecture seule pour les membres. */
describe("formats d'achat", () => {
  it("couvrent les produits courants, dans la dimension de l'ingrédient", async () => {
    const { rows } = await pool.query<{ slug: string; dim: string; qty: string; label: string }>(
      `select i.slug, i.default_dimension as dim, f.quantity_base as qty, f.label
       from public.purchase_formats f join public.ingredients i on i.id = f.ingredient_id`,
    );
    expect(rows.length).toBeGreaterThan(100);
    expect(rows.every((r) => r.dim !== "count")).toBe(true);
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    expect(bySlug.get("huile-olive")).toMatchObject({ qty: "750.000", label: "75 cl" });
    expect(bySlug.get("spaghetti")).toMatchObject({ qty: "500.000", label: "500 g" });
  });

  it("un membre les lit, sans pouvoir les modifier ; un visiteur n'y a pas accès", async () => {
    const user = await createUser("formats-achat");
    const n = await asUser(user, async (db) => {
      const r = await db.query<{ n: number }>(
        "select count(*)::int as n from public.purchase_formats",
      );
      return r.rows[0]!.n;
    });
    expect(n).toBeGreaterThan(100);
    const write = await asUser(user, (db) =>
      expectPgError(db.query("update public.purchase_formats set label = 'x'")),
    );
    expect(write).toBe("42501");
    const anon = await asUser(null, (db) =>
      expectPgError(db.query("select 1 from public.purchase_formats")),
    );
    expect(anon).toBe("42501");
  });
});
