import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

/** 0093 : variantes dont le stock compte pour une recette qui demande le parent. */
describe("variantes du stock", () => {
  it("oignon rouge, haricots verts et épinards surgelés, pâtes complètes", async () => {
    const { rows } = await pool.query(
      `select c.slug, p.slug as parent from public.ingredients c
       join public.ingredients p on p.id = c.parent_id
       where c.slug in ('oignon-rouge', 'haricot-vert-surgele', 'epinard-galets', 'pates-completes')
       order by c.slug`,
    );
    expect(rows.map((r) => [r.slug, r.parent])).toEqual([
      ["epinard-galets", "epinard"],
      ["haricot-vert-surgele", "haricot-vert"],
      ["oignon-rouge", "oignon"],
      ["pates-completes", "pates"],
    ]);
  });
});
