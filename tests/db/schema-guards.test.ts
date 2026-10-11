import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

/**
 * Garde-fous génériques : ils échouent dès qu'une future migration
 * oublie une protection, sans avoir à écrire un test par table.
 */
describe("garde-fous du schéma public", () => {
  it("toutes les tables ont la RLS activée", async () => {
    const { rows } = await pool.query<{ table: string }>(
      `select c.relname as table
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
       order by 1`,
    );
    expect(rows.map((r) => r.table)).toEqual([]);
  });

  it("anon n'a aucun privilège de table", async () => {
    const { rows } = await pool.query<{ table: string; privilege: string }>(
      `select table_name as table, privilege_type as privilege
       from information_schema.role_table_grants
       where table_schema = 'public' and grantee = 'anon'
       order by 1, 2`,
    );
    expect(rows).toEqual([]);
  });

  it("les fonctions SECURITY DEFINER fixent leur search_path et sont fermées à anon", async () => {
    const { rows } = await pool.query<{ fn: string; has_search_path: boolean; anon_exec: boolean }>(
      `select p.proname as fn,
              coalesce(array_to_string(p.proconfig, ',') like '%search_path=%', false) as has_search_path,
              has_function_privilege('anon', p.oid, 'execute') as anon_exec
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.prosecdef
       order by 1`,
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.has_search_path, `${row.fn} : search_path`).toBe(true);
      expect(row.anon_exec, `${row.fn} : exécutable par anon`).toBe(false);
    }
  });

  it("normalize_alias unifie casse, accents et ponctuation", async () => {
    const { rows } = await pool.query<{ a: string; b: string; c: string | null }>(
      "select public.normalize_alias('  Pommes  de Terre ') a, public.normalize_alias('Crème fraîche, épaisse') b, public.normalize_alias('  ') c",
    );
    expect(rows[0]).toEqual({ a: "pommes de terre", b: "creme fraiche epaisse", c: null });
  });
});
