import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import type { TestProject } from "vitest/node";

/**
 * Deux modes, choisis par TEST_DB_MODE :
 *
 * - "supabase" (défaut) : DATABASE_URL pointe vers le Supabase local
 *   (`npm run db:reset` a déjà appliqué migrations et seed). Rien n'est recréé.
 *
 * - "bench" : DATABASE_URL pointe vers un PostgreSQL nu. Une base jetable
 *   `meal_test` est recréée, la reproduction Supabase (supabase-shim.sql)
 *   puis toutes les migrations y sont appliquées dans l'ordre.
 */
export default async function setup(project: TestProject) {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error(
      "DATABASE_URL manquante. Voir tests/db/README.md pour lancer les tests de base de données.",
    );
  }
  const mode = process.env.TEST_DB_MODE ?? "supabase";

  if (mode !== "bench") {
    project.provide("dbUrl", baseUrl);
    return;
  }

  const admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  await admin.query("drop database if exists meal_test with (force)");
  await admin.query("create database meal_test");
  await admin.end();

  const url = new URL(baseUrl);
  url.pathname = "/meal_test";
  const dbUrl = url.toString();

  const db = new Client({ connectionString: dbUrl });
  await db.connect();
  try {
    const root = process.cwd();
    await db.query(await readFile(path.join(root, "tests/db/supabase-shim.sql"), "utf8"));

    const dir = path.join(root, "supabase/migrations");
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      try {
        await db.query(await readFile(path.join(dir, file), "utf8"));
      } catch (error) {
        throw new Error(`Échec de la migration ${file} : ${(error as Error).message}`);
      }
    }
  } finally {
    await db.end();
  }

  project.provide("dbUrl", dbUrl);
}

declare module "vitest" {
  export interface ProvidedContext {
    dbUrl: string;
  }
}
