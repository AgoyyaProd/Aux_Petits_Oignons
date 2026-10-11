import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": src },
  },
  test: {
    projects: [
      {
        // Tests purs : domaine, validation, utilitaires. Aucune I/O.
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        // Tests de base de données : migrations, RLS, fonctions SQL.
        // Exigent DATABASE_URL (Supabase local ou banc PostgreSQL, voir tests/db/README.md).
        extends: true,
        test: {
          name: "db",
          include: ["tests/db/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/db/global-setup.ts"],
          // Les tests partagent une base : exécution séquentielle.
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
