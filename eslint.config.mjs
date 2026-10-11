import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Le client service_role contourne la RLS : interdit dans le code applicatif.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/supabase/admin", "**/server/supabase/admin"],
              message:
                "Le client service_role contourne la RLS. Réservé aux scripts de seed et aux tests.",
            },
          ],
        },
      ],
    },
  },
  {
    // Exception unique et documentée : la tâche planifiée écrit des prix de référence publics.
    files: ["src/app/api/cron/prices/route.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Le domaine reste pur : ni Supabase, ni Next.js, ni accès réseau.
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@supabase/*", "next", "next/*", "@/server/*", "@/app/*"],
              message: "Le domaine doit rester pur (aucune I/O).",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "src/types/database.ts",
  ]),
]);

export default eslintConfig;
