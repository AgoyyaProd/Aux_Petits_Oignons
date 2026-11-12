import type { Metadata } from "next";
import { Suspense } from "react";
import { StaplesForm } from "@/components/pantry/staples-form";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getStaplesPage } from "@/server/modules/pantry/staples";
import { Hero } from "@/components/ui/hero";

export const metadata: Metadata = { title: "Mon placard" };

export default function StaplesPage() {
  return (
    <div className="flex flex-col gap-6">
      <Hero
        back={{ href: "/pantry", label: "Garde-manger" }}
        title="Mon placard"
        description={
          <>
            Coche les épices, herbes, sauces et produits de base que tu as. Pas besoin de quantité :
            ils sont considérés comme présents dans les recettes et le menu, et ne seront pas
            ajoutés à ta liste de courses. Décoche-les quand ils sont finis.
          </>
        }
        decor="leaf"
      />
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
