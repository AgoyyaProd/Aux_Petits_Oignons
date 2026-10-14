import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageShapes } from "@/components/brand/page-shapes";
import { PlannerView } from "@/components/planner/planner-view";
import { weekBalance } from "@/domain/nutrition";
import type { PlannerEntryView, PlannerPage } from "@/server/modules/planning/queries";

export const metadata: Metadata = { title: "Aperçu du menu", robots: { index: false } };

const DAYS = Array.from({ length: 7 }, (_, i) => `2026-10-${String(12 + i).padStart(2, "0")}`);

function entry(
  position: number,
  slug: string,
  title: string,
  day: string | null,
  extra: Partial<PlannerEntryView> = {},
): PlannerEntryView {
  return {
    position,
    recipeId: `00000000-0000-0000-0000-0000000000${String(position).padStart(2, "0")}`,
    slug,
    title,
    tags: ["plat"],
    servings: 2,
    locked: false,
    totalMinutes: 35,
    cents: 412,
    missingNames: [],
    available: true,
    cooked: false,
    favorite: false,
    day,
    slot: day ? "dinner" : null,
    leftover: false,
    leftoverOf: null,
    hasLeftovers: false,
    proteinPerServing: 18 + ((position * 7) % 17),
    ...extra,
  };
}

function demo(draft: boolean): PlannerPage {
  const entries = [
    entry(1, "fajitas-poulet", "Fajitas de poulet", DAYS[0]!, {
      cooked: true,
      servings: 4,
      hasLeftovers: true,
    }),
    entry(2, "fajitas-poulet", "Fajitas de poulet", DAYS[1]!, {
      leftover: true,
      leftoverOf: "Lundi 12 soir",
      cents: 0,
    }),
    entry(3, "curry-pois-chiches-epinards", "Curry de pois chiches aux épinards", DAYS[2]!, {
      servings: 4,
      hasLeftovers: true,
      favorite: true,
    }),
    entry(4, "curry-pois-chiches-epinards", "Curry de pois chiches aux épinards", DAYS[3]!, {
      leftover: true,
      leftoverOf: "Mercredi 14 soir",
      cents: 0,
    }),
    entry(5, "nouilles-sautees-tofu", "Nouilles sautées au tofu et légumes", DAYS[4]!, {
      locked: true,
    }),
    entry(6, "boeuf-bourguignon", "Bœuf bourguignon", DAYS[5]!, {
      slot: "lunch",
      totalMinutes: 210,
      cents: 1280,
    }),
    entry(7, "pad-thai-crevettes", "Pad thaï aux crevettes", DAYS[5]!, {
      missingNames: ["Crevettes"],
    }),
    entry(8, "aloo-gobi", "Aloo gobi", DAYS[6]!),
  ];
  return {
    householdId: "demo",
    weekStart: DAYS[0]!,
    previousWeek: "2026-10-05",
    nextWeek: "2026-10-19",
    isCurrentWeek: true,
    referenceStore: "Leclerc",
    defaults: { people: 2, budgetCents: 6000, mealCount: 9 },
    mealsPerCook: 2,
    plan: {
      version: draft ? "d3" : "p2",
      isDraft: draft,
      hasValidated: true,
      people: 2,
      mealCount: 9,
      budgetCents: 6000,
      shoppingDoneAt: null,
    },
    entries,
    balance: weekBalance([]),
    totals: {
      cents: entries.reduce((s, e) => s + e.cents, 0),
      entriesWithMissing: 1,
      missingNames: ["Crevettes"],
    },
    today: DAYS[1]!,
    slots: DAYS.flatMap((day, i) =>
      (["lunch", "dinner"] as const).map((slot) => ({
        value: `${day}:${slot}`,
        label: `${day} ${slot === "lunch" ? "midi" : "soir"}`,
        day,
        planned: slot === "dinner" || i >= 5,
      })),
    ),
    candidateCount: 180,
    protein: { target: 30, measured: 8, reached: 3 },
    choices: [
      ["curry-pois-chiches", "Curry de pois chiches", 35, 142],
      ["gratin-dauphinois", "Gratin dauphinois", 75, 118],
      ["poulet-basquaise", "Poulet basquaise", 55, 265],
      ["risotto-champignons", "Risotto aux champignons", 40, 189],
      ["salade-lentilles", "Salade de lentilles", 25, 96],
      ["tarte-poireaux", "Tarte aux poireaux", 50, 131],
    ].map(([slug, title, minutes, cents], i) => ({
      id: `10000000-0000-0000-0000-0000000000${String(i + 10)}`,
      slug,
      title,
      tags: [],
      totalMinutes: minutes,
      centsPerServing: cents,
      partialPrice: false,
      favorite: i === 2,
    })),
    prices: { pricedIngredients: 200, lastObservation: "2026-10-12" },
    newKey: () => "00000000-0000-4000-8000-000000000000",
  } as unknown as PlannerPage;
}

/** Aperçu de « Mon menu » dans la coquille de l'application (DESIGN_PREVIEW=1 seulement). */
export default function MenuPreview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.DESIGN_PREVIEW !== "1") notFound();
  return (
    <div className="relative isolate flex min-h-full flex-1">
      <PageShapes />
      <aside className="border-border bg-surface sticky top-0 hidden h-dvh w-64 shrink-0 border-r lg:block" />
      <main className="mx-auto w-full max-w-[120rem] flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-12 lg:pt-12 lg:pb-20 xl:px-16">
        <Suspense fallback={null}>
          <Preview searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

async function Preview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const draft = (await searchParams).etat !== "valide";
  return <PlannerView page={demo(draft)} justValidated={!draft} />;
}
