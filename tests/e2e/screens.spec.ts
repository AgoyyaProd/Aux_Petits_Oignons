import { expect, test } from "@playwright/test";

/**
 * Chaque écran connecté s'affiche sans l'écran d'erreur, avec son titre ; une capture est
 * gardée pour vérifier la mise en page (ordinateur et téléphone).
 */
const SCREENS = [
  { path: "/dashboard", name: "accueil" },
  { path: "/recipes", name: "recettes", heading: "Nos recettes" },
  { path: "/planner", name: "menu", heading: "Mon menu de la semaine" },
  { path: "/shopping", name: "courses", heading: "Ma liste de courses" },
  { path: "/pantry", name: "garde-manger", heading: "Mon garde-manger" },
  { path: "/budget", name: "budget" },
  { path: "/settings", name: "preferences", heading: "Profil et préférences" },
  { path: "/planner/imprimer", name: "feuille-semaine" },
];

for (const screen of SCREENS) {
  test(`écran ${screen.name}`, async ({ page }, info) => {
    await page.goto(screen.path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    if (screen.heading) {
      await expect(page.getByRole("heading", { level: 1, name: screen.heading })).toBeVisible();
    }
    await expect(page.getByText("n'a pas pu s'afficher")).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: info.outputPath(`${screen.name}.png`),
      fullPage: true,
    });
  });
}

test("fiche recette : étapes, quantités et minuteurs", async ({ page }, info) => {
  await page.goto("/recipes");
  await page.locator("ul li h3 a").first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("tab", { name: "Étapes" }).click();
  await expect(page.getByRole("list", { name: "Ingrédients de l'étape" }).first()).toBeVisible();
  await expect(page.getByText("n'a pas pu s'afficher")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("recette-etapes.png"), fullPage: true });
});

test("liste de courses : écoute du foyer en direct", async ({ page }) => {
  await page.goto("/shopping");
  await expect(page.getByText("Partagée en direct avec ton foyer")).toBeVisible({
    timeout: 15_000,
  });
});
