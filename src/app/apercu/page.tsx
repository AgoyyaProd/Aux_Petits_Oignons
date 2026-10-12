import { RecipeFacts } from "@/components/recipes/recipe-facts";
import { NutritionPanel } from "@/components/recipes/nutrition-panel";
import { computeRecipeNutrition, type Per100g } from "@/domain/nutrition";
import { quantity } from "@/domain/units";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo, LogoMark } from "@/components/brand/logo";
import { SideNavShell, TabBarShell } from "@/components/layout/app-nav";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { CheckLine } from "@/components/shopping/check-line";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/skeleton";
import type { RecipeCard as Card, RecipeDetail } from "@/server/modules/recipes/queries";
import { CookMode } from "@/components/recipes/cook-mode";
import { KitchenProvider } from "@/components/recipes/kitchen";
import { RecipeBody } from "@/components/recipes/recipe-body";
import { matchStepIngredients, parseStepTimers } from "@/domain/recipes/steps";

export const metadata: Metadata = { title: "Aperçu du design system", robots: { index: false } };

/**
 * Galerie du design system, avec des données de démonstration (jamais en production :
 * activée seulement si DESIGN_PREVIEW=1 au moment du build).
 */
export default function DesignPreview() {
  if (process.env.DESIGN_PREVIEW !== "1") notFound();

  const card = (over: Partial<Card>): Card => ({
    id: "00000000-0000-4000-8000-000000000001",
    slug: "poulet-basquaise",
    title: "Poulet basquaise",
    description: null,
    servings: 4,
    totalMinutes: 65,
    tags: ["plat"],
    vegetarian: false,
    vegan: false,
    coverage: { inStock: 5, total: 8 },
    compatibility: { compatible: true, reasons: [], toRemove: [] },
    exclusionLabel: null,
    rating: null,
    usesPriority: false,
    costPerServingCents: 245,
    costIsMinimum: false,
    difficulty: "moyenne",
    season: "in",
    ...over,
  });
  const families = [
    ["spaghetti-carbonara", "Spaghetti carbonara", ["plat"]],
    ["riz-cantonais", "Riz cantonais", ["plat"]],
    ["minestrone", "Minestrone", ["soupe"]],
    ["salade-grecque", "Salade grecque", ["salade"]],
    ["mousse-chocolat", "Mousse au chocolat", ["dessert"]],
    ["saumon-grenailles-citron", "Saumon et grenailles", ["plat"]],
    ["chili-con-carne", "Chili con carne", ["plat"]],
    ["shakshuka", "Shakshuka", ["plat"]],
    ["ratatouille", "Ratatouille", ["plat"]],
  ] as const;

  return (
    <div className="flex flex-col gap-14 p-6 lg:p-10">
      <section className="flex flex-wrap items-center gap-8">
        <Logo size={36} />
        <LogoMark size={48} />
        <span className="bg-forest rounded-xl p-3">
          <Logo tone="inverse" size={40} />
        </span>
        <Logo size={30} stacked={false} />
        <span className="text-forest">
          <LogoMark tone="mono" size={40} />
        </span>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-section">Typographie</h2>
        <p className="type-display">Bien manger, ça change tout.</p>
        <p className="type-page">Menu de la semaine</p>
        <p className="type-section">À consommer vite</p>
        <p className="type-card">Coquillettes jambon-emmental</p>
        <p className="type-meta">17 min, 4 parts, environ 1,15 € la part</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-section">Boutons, badges, états</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Générer mon menu</Button>
          <Button variant="accent">Finir les courses</Button>
          <Button variant="secondary">Ajouter au menu</Button>
          <Button variant="ghost">Historique</Button>
          <Button variant="text">Tout effacer</Button>
          <Button disabled>Désactivé</Button>
          <Button variant="secondary">
            <Spinner label="Chargement…" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="urgent">DLC demain</Badge>
          <Badge tone="soon">DLC dans 3 j</Badge>
          <Badge tone="leaf">5/8 chez toi</Badge>
          <Badge tone="brand">Cuisiné</Badge>
          <Badge tone="neutral">Végétarien</Badge>
          <Badge tone="danger">Allergie : gluten</Badge>
        </div>
        <div className="grid max-w-2xl gap-3">
          <Alert tone="success">Menu proposé.</Alert>
          <Alert tone="error">Le menu a été modifié entre-temps. Recharge la page.</Alert>
          <Alert tone="warning">2 articles sans prix : le total est un minimum.</Alert>
          <Alert tone="info">3 recettes masquées selon tes allergies.</Alert>
        </div>
        <div className="grid max-w-md gap-3">
          <Field label="Nom du foyer" defaultValue="Foyer de démonstration" />
          <Field label="Budget (€)" error="Montant invalide (exemple : 85 ou 85,50)." />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-section">Cartes de recettes</h2>
        <ul className="grid gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
          <RecipeCard recipe={card({})} />
          <RecipeCard
            recipe={card({
              slug: "risotto-butternut",
              title: "Risotto à la courge butternut",
              rating: 1,
              usesPriority: true,
              vegetarian: true,
              coverage: { inStock: 2, total: 6 },
              costIsMinimum: true,
            })}
          />
          <RecipeCard
            recipe={card({
              slug: "lasagnes-bolognaise",
              title: "Lasagnes à la bolognaise",
              compatibility: { compatible: false, reasons: [], toRemove: [] },
              exclusionLabel: "Allergie : gluten",
            })}
          />
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-section">Visuels de remplacement</h2>
        <ul className="grid grid-cols-3 gap-4 lg:grid-cols-9">
          {families.map(([slug, title, tags]) => (
            <li key={slug} className="flex flex-col gap-1.5">
              <span className="aspect-[4/3] overflow-hidden rounded-lg">
                <RecipeVisual slug={slug} title={title} tags={tags} />
              </span>
              <span className="text-xs">{title}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex max-w-xl flex-col gap-4">
        <h2 className="type-section">Liste de courses</h2>
        <ul className="border-border bg-surface divide-border divide-y rounded-2xl border px-4">
          {[
            ["Courge butternut", "1 pièce", false],
            ["Crème fraîche", "20 cl", true],
          ].map(([name, qty, checked]) => (
            <li key={String(name)}>
              <CheckLine
                week="2026-10-12"
                ingredientId="x"
                dimension="count"
                checked={Boolean(checked)}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="item-name text-base font-semibold">{name}</span>
                  <span className="text-base font-semibold">{qty}</span>
                </span>
                <span className="text-muted text-sm">Risotto à la courge butternut</span>
              </CheckLine>
            </li>
          ))}
        </ul>
        <EmptyState title="Rien à acheter">Ton garde-manger couvre tout le menu.</EmptyState>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-section">Étapes, quantités et minuteurs</h2>
        <KitchenProvider baseServings={2}>
          <div className="flex flex-col gap-4">
            <CookMode
              title={DEMO.title}
              steps={DEMO.steps}
              ingredients={DEMO.ingredients}
              stepDetails={DEMO.stepDetails}
            />
            <RecipeBody
              recipeId="demo"
              ingredients={DEMO.ingredients}
              steps={DEMO.steps}
              stepDetails={DEMO.stepDetails}
              baseServings={2}
              inMenu
            />
          </div>
        </KitchenProvider>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="type-section">Informations de recette</h2>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-stretch lg:gap-16">
          <RecipeVisual
            slug="boeuf-bourguignon"
            title="Bœuf bourguignon"
            className="aspect-[4/3] rounded-3xl lg:aspect-auto lg:h-full lg:min-h-[26rem]"
          />
          <div className="flex flex-col gap-4">
            <RecipeFacts
              prepMinutes={30}
              cookMinutes={170}
              servings={6}
              stepCount={11}
              difficulty="elaboree"
              cost={{ cents: 2460, missingNames: [] }}
              kcal={{ value: 612.4, partial: false }}
              equipmentLabels={["Faitout ou cocotte", "Poêle"]}
              allergenLabels={["Céleri", "Sulfites"]}
            />
            <RecipeFacts
              prepMinutes={10}
              cookMinutes={0}
              servings={2}
              stepCount={4}
              difficulty="facile"
              cost={{ cents: 610, missingNames: ["Graines de chia"] }}
              kcal={null}
              equipmentLabels={[]}
              allergenLabels={[]}
            />
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="type-section">Valeurs nutritionnelles</h2>
        <NutritionPanel nutrition={DEMO_NUTRITION} />
        <NutritionPanel nutrition={DEMO_NUTRITION_UNRELIABLE} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="type-section">Navigation</h2>
        <div className="bg-surface border-border max-w-64 rounded-2xl border p-3">
          <SideNavShell pathname="/planner" />
        </div>
        <div className="relative h-24 max-w-md overflow-hidden rounded-2xl border [&_nav]:absolute [&_nav]:!block">
          <TabBarShell pathname="/shopping" />
        </div>
      </section>
    </div>
  );
}

/** Recette fictive de démonstration (galerie uniquement) : étapes, quantités, minuteurs. */
const DEMO_INGREDIENTS: RecipeDetail["ingredients"] = [
  {
    ingredientId: "pates",
    name: "Pâtes",
    quantity: "200",
    unit: "g",
    optional: false,
    note: null,
    inStock: true,
    inCupboard: false,
  },
  {
    ingredientId: "oignon",
    name: "Oignon",
    quantity: "1",
    unit: "piece",
    optional: false,
    note: null,
    inStock: true,
    inCupboard: false,
  },
  {
    ingredientId: "huile",
    name: "Huile d'olive",
    quantity: "1",
    unit: "tbsp",
    optional: false,
    note: null,
    inStock: true,
    inCupboard: true,
  },
  {
    ingredientId: "coulis",
    name: "Coulis de tomate",
    quantity: "250",
    unit: "g",
    optional: false,
    note: null,
    inStock: false,
    inCupboard: false,
  },
];
const DEMO_STEPS = [
  "Éplucher et hacher l'oignon.",
  "Chauffer l'huile dans une casserole à feu moyen et faire fondre l'oignon 5 minutes.",
  "Verser le coulis et laisser mijoter 15 minutes à feu doux.",
  "Cuire les pâtes 9 à 11 minutes dans une grande casserole d'eau bouillante, puis les égoutter.",
];
const DEMO = {
  title: "Pâtes à la sauce tomate (démo)",
  ingredients: DEMO_INGREDIENTS,
  steps: DEMO_STEPS,
  stepDetails: matchStepIngredients(
    DEMO_STEPS,
    DEMO_INGREDIENTS.map((i) => ({ id: i.ingredientId, name: i.name })),
  ).map((ingredientIds, i) => ({ ingredientIds, timers: parseStepTimers(DEMO_STEPS[i]!) })),
};

/** Valeurs Ciqual 2025 réelles (riz blanc cru, œuf cru, huile d'olive, ricotta). */
const CIQ: Record<string, Per100g> = {
  riz: {
    kcal: 350,
    proteins: 7.02,
    carbs: 77.5,
    sugars: 0.12,
    fat: 0.79,
    saturatedFat: 0.16,
    fiber: 1.53,
    salt: 0.008,
  },
  oeuf: {
    kcal: 140,
    proteins: 12.8,
    carbs: 0.06,
    sugars: 0.06,
    fat: 9.83,
    saturatedFat: 2.64,
    fiber: 0,
    salt: 0.31,
  },
  huile: {
    kcal: 899,
    proteins: 0.25,
    carbs: 0,
    sugars: 0,
    fat: 99.9,
    saturatedFat: 15.2,
    fiber: 0,
    salt: 0,
  },
  ricotta: {
    kcal: null,
    proteins: 8.13,
    carbs: 4.09,
    sugars: 3.69,
    fat: 10.7,
    saturatedFat: 7.38,
    fiber: 0,
    salt: 0.27,
  },
};

const DEMO_NUTRITION = computeRecipeNutrition(
  [
    {
      name: "Riz",
      optional: false,
      quantity: quantity("300", "g"),
      conversions: {},
      per100g: CIQ.riz!,
    },
    {
      name: "Œuf",
      optional: false,
      quantity: quantity("4", "piece"),
      conversions: { pieceWeightG: 55 },
      per100g: CIQ.oeuf!,
    },
    {
      name: "Huile d'olive",
      optional: false,
      quantity: quantity("2", "tbsp"),
      conversions: { densityGPerMl: 0.92 },
      per100g: CIQ.huile!,
    },
    {
      name: "Ricotta",
      optional: false,
      quantity: quantity("100", "g"),
      conversions: {},
      per100g: CIQ.ricotta!,
    },
    {
      name: "Pâte de curry",
      optional: false,
      quantity: quantity("30", "g"),
      conversions: {},
      per100g: null,
    },
  ],
  4,
);

const DEMO_NUTRITION_UNRELIABLE = computeRecipeNutrition(
  [
    {
      name: "Huile d'olive",
      optional: false,
      quantity: quantity("2", "tbsp"),
      conversions: { densityGPerMl: 0.92 },
      per100g: CIQ.huile!,
    },
    {
      name: "Moules",
      optional: false,
      quantity: quantity("2", "kg"),
      conversions: {},
      per100g: null,
    },
  ],
  4,
);
