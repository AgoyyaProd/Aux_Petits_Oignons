import { expect, test as setup } from "@playwright/test";

/** Connexion une seule fois avec le compte de test ; la session est réutilisée par les tests. */
setup("connexion du compte de test", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  setup.skip(!email || !password, "E2E_EMAIL et E2E_PASSWORD ne sont pas définis.");
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email!);
  await page.getByLabel("Mot de passe").fill(password!);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await page.context().storageState({ path: "tests/e2e/.auth/user.json" });
});
