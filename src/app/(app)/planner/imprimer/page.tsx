import type { Metadata } from "next";
import { Suspense } from "react";
import { WeekSheet } from "@/components/planner/week-sheet";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getPlannerPage } from "@/server/modules/planning/queries";
import { getShoppingPage } from "@/server/modules/shopping/queries";

export const metadata: Metadata = { title: "Menu à imprimer" };
export const maxDuration = 30;

export default function PrintWeekRoute({ searchParams }: PageProps<"/planner/imprimer">) {
  return (
    <Suspense fallback={<PageSkeleton rows={4} />}>
      <PrintWeek searchParams={searchParams} />
    </Suspense>
  );
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

async function PrintWeek({ searchParams }: Pick<PageProps<"/planner/imprimer">, "searchParams">) {
  const week = one((await searchParams).semaine);
  const [planner, shopping] = await Promise.all([getPlannerPage({ week }), getShoppingPage(week)]);
  if (!planner) return <p className="text-muted">Aucun foyer actif.</p>;

  return (
    <WeekSheet
      weekStart={planner.weekStart}
      days={[...new Set(planner.slots.map((s) => s.day))]}
      people={planner.plan?.people ?? null}
      hasPlan={Boolean(planner.plan)}
      entries={planner.entries}
      aisles={
        shopping && "aisles" in shopping
          ? shopping.aisles
              .map((a) => ({
                category: a.category,
                label: a.label,
                lines: a.lines
                  .filter((l) => !l.checked)
                  .map((l) => ({
                    key: `${l.ingredientId}|${l.dimension}`,
                    name: l.name,
                    toBuy: l.toBuy,
                  })),
              }))
              .filter((a) => a.lines.length)
          : []
      }
      extras={(shopping?.extras ?? []).filter((e) => !e.checked)}
    />
  );
}
