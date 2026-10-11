import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AvoidedFoodsForm } from "@/components/settings/avoided-foods-form";
import { HouseholdForm } from "@/components/settings/household-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { buttonClasses } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getHouseholdSettings } from "@/server/modules/households/queries";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
      <Suspense fallback={<PageSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  const settings = await getHouseholdSettings();
  if (!settings) return <p className="text-muted">Aucun foyer actif.</p>;

  return (
    <>
      <Section title="Foyer">
        <HouseholdForm household={settings.household} isOwner={settings.isOwner} />
      </Section>
      <Section title="Régimes et allergies">
        <PreferencesForm
          householdId={settings.household.id}
          diets={settings.diets}
          allergens={settings.allergens}
          selectedDiets={settings.selectedDiets}
          selectedAllergens={settings.selectedAllergens}
        />
      </Section>
      <Section title="Prix et magasin">
        <p className="text-muted text-sm">
          Choisis ton magasin de référence et renseigne tes propres prix pour affiner le coût des
          menus.
        </p>
        <Link href="/prices" className={buttonClasses("secondary")}>
          Gérer mes prix
        </Link>
      </Section>
      <Section title="Aliments que tu ne veux pas manger">
        <AvoidedFoodsForm
          householdId={settings.household.id}
          avoidedFoods={settings.avoidedFoods}
          ingredientNames={settings.ingredientNames}
        />
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
