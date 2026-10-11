import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AddItemForm } from "@/components/pantry/add-item-form";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getCurrentContext } from "@/server/modules/auth/session";
import { getIngredientChoices } from "@/server/modules/pantry/queries";

export const metadata: Metadata = { title: "Ajouter un produit" };

export default function NewPantryItemPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/pantry" className="text-brand text-sm font-medium">
          ← Garde-manger
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Ajouter un produit</h1>
      </div>
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
