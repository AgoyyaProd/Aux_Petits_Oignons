import type { Metadata } from "next";
import { Suspense } from "react";
import { PlannerView } from "@/components/planner/planner-view";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getPlannerPage } from "@/server/modules/planning/queries";

export const metadata: Metadata = { title: "Menu de la semaine" };

// La génération et la sauvegarde lisent recettes, prix et stock : on laisse de la marge.
export const maxDuration = 30;

export default function PlannerPageRoute({ searchParams }: PageProps<"/planner">) {
  return (
    <Suspense fallback={<PageSkeleton rows={4} />}>
      <PlannerContent searchParams={searchParams} />
    </Suspense>
  );
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function PlannerContent({ searchParams }: Pick<PageProps<"/planner">, "searchParams">) {
  const sp = await searchParams;
  const page = await getPlannerPage({ week: one(sp.semaine) });
  if (!page) return <p className="text-muted">Aucun foyer actif.</p>;
  return <PlannerView page={page} justValidated={one(sp.valide) === "1"} />;
}
