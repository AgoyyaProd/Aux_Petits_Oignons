import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout sur le site déployé, avec un compte de test dédié (foyer séparé).
 * Lecture seule : les tests naviguent et vérifient l'affichage, sans rien modifier.
 *   E2E_BASE_URL  site à tester (par défaut la production)
 *   E2E_EMAIL / E2E_PASSWORD  identifiants du compte de test (secrets GitHub)
 *   E2E_CHROMIUM  chemin d'un Chromium déjà installé (facultatif, en local)
 */
const executablePath = process.env.E2E_CHROMIUM || undefined;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [
        ["list"],
        ["html", { open: "never" }],
        ["json", { outputFile: "test-results/resultats.json" }],
      ]
    : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://aux-petits-oignons-azure.vercel.app",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "ordinateur",
      use: { ...devices["Desktop Chrome"], storageState: "tests/e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
    {
      name: "telephone",
      use: { ...devices["Pixel 7"], storageState: "tests/e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
});
