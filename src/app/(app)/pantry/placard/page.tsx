import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StaplesForm } from "@/components/pantry/staples-form";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getStaplesPage } from "@/server/modules/pantry/staples";

export const metadata: Metadata = { title: "Mon placard" };

export default function StaplesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/pantry" className="text-brand text-sm font-medium">
          ← Garde-manger
        </Link>
        <h1 className="type-page">Mon placard</h1>
        <p className="text-muted text-sm">
          Coche les épices, herbes, sauces et produits de base que tu as. Pas besoin de quantité :
          ils sont considérés comme présents dans les recettes et le menu, et ne seront pas ajoutés
          à ta liste de courses. Décoche-les quand ils sont finis.
        </p>
      </div>
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <StaplesContent />
      </Suspense>
    </div>
  );
}

async function StaplesContent() {
  const page = await getStaplesPage();
  if (!page) return <p className="text-muted">Aucun foyer actif.</p>;
  return <StaplesForm householdId={page.householdId} groups={page.groups} />;
}
