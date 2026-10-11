import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { afterAll, inject } from "vitest";

/** Pool administrateur (rôle postgres) : prépare les données, contourne la RLS. */
export const pool = new Pool({ connectionString: inject("dbUrl"), max: 4 });

afterAll(async () => {
  await pool.end();
});

export interface TestUser {
  id: string;
  email: string;
  householdId: string;
}

/** Crée un utilisateur comme le ferait Supabase Auth ; le trigger d'inscription s'exécute. */
export async function createUser(label: string): Promise<TestUser> {
  const email = `${label}-${randomUUID().slice(0, 8)}@test.local`;
  const { rows } = await pool.query<{ id: string }>(
    `insert into auth.users (id, email, raw_user_meta_data)
     values (gen_random_uuid(), $1, jsonb_build_object('display_name', $2::text))
     returning id`,
    [email, label],
  );
  const id = rows[0]!.id;
  const profile = await pool.query<{ active_household_id: string }>(
    "select active_household_id from public.profiles where id = $1",
    [id],
  );
  return { id, email, householdId: profile.rows[0]!.active_household_id };
}

type Role = "authenticated" | "anon";

/**
 * Exécute `fn` dans une transaction avec le rôle et le JWT d'un utilisateur,
 * exactement comme une requête PostgREST. La transaction est annulée à la fin,
 * sauf si `commit` est vrai (nécessaire pour enchaîner plusieurs utilisateurs).
 */
export async function asUser<T>(
  user: TestUser | null,
  fn: (db: PoolClient) => Promise<T>,
  { role = "authenticated" as Role, commit = false } = {},
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${user ? role : "anon"}`);
    const claims = user ? { sub: user.id, email: user.email, role } : { role: "anon" };
    await client.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(claims),
    ]);
    const result = await fn(client);
    await client.query(commit ? "commit" : "rollback");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/** Attend une erreur PostgreSQL et renvoie son code SQLSTATE. */
export async function expectPgError(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (!code) throw error;
    return code;
  }
  throw new Error("Une erreur PostgreSQL était attendue, la requête a réussi.");
}

/** SQLSTATE utiles. */
export const PG = {
  insufficientPrivilege: "42501",
  invalidParameter: "22023",
} as const;
