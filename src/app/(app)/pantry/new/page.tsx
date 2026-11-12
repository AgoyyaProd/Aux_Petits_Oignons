import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AddItemForm } from "@/components/pantry/add-item-form";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getCurrentContext } from "@/server/modules/auth/session";
import { getIngredientChoices } from "@/server/modules/pantry/queries";
import { Hero } from "@/components/ui/hero";

export const metadata: Metadata = { title: "Ajouter un produit" };

export default function NewPantryItemPage() {
  return (
    <div className="flex flex-col gap-6">
      <Hero
        back={{ href: "/pantry", label: "Garde-manger" }}
        title="Ajouter un produit"
        decor="half"
      />
      <Suspense fallback={<PageSkeleton rows={2} />}>
        <FormLoader />
      </Suspense>
    </div>
  );
}

async function FormLoader() {
  const [{ household }, choices] = await Promise.all([getCurrentContext(), getIngredientChoices()]);
  if (!household) return <p className="text-muted">Aucun foyer actif.</p>;
  return (
    <div className="border-border bg-surface rounded-2xl border p-4">
      <AddItemForm householdId={household.id} choices={choices} initialKey={randomUUID()} />
    </div>
  );
}
