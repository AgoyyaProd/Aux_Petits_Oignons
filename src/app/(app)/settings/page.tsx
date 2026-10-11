import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AvoidedFoodsForm } from "@/components/settings/avoided-foods-form";
import { HouseholdForm } from "@/components/settings/household-form";
import { MembersSection } from "@/components/settings/members-section";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { buttonClasses } from "@/components/ui/button";
import { signOutAction } from "@/server/modules/auth/actions";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getMembersSection } from "@/server/modules/households/members";
import { getHouseholdSettings } from "@/server/modules/households/queries";
import { getIngredientChoices } from "@/server/modules/pantry/queries";

export const metadata: Metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Profil et préférences"
        description="Ton foyer, ses membres et ce que vous mangez : ces réglages décident des recettes et des menus proposés."
      />
      <Suspense fallback={<PageSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  const [settings, members, choices] = await Promise.all([
    getHouseholdSettings(),
    getMembersSection(),
    getIngredientChoices(),
  ]);
  if (!settings || !members) return <p className="text-muted">Aucun foyer actif.</p>;

  return (
    <>
      <Section title="Foyer">
        <HouseholdForm household={settings.household} isOwner={settings.isOwner} />
      </Section>
      <Section title="Membres du foyer">
        <MembersSection
          householdId={members.householdId}
          isOwner={members.isOwner}
          members={members.members}
          invitations={members.invitations}
          households={members.households}
        />
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
      <Section title="Budget, prix et magasin">
        <p className="text-muted text-sm">
          Suis le coût estimé de tes menus, choisis ton magasin de référence et renseigne tes
          propres prix pour affiner les estimations.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/budget" className={buttonClasses("secondary")}>
            Voir le budget
          </Link>
          <Link href="/prices" className={buttonClasses("secondary")}>
            Gérer mes prix
          </Link>
        </div>
      </Section>
      <Section title="Aliments que tu ne veux pas manger">
        <AvoidedFoodsForm
          householdId={settings.household.id}
          avoidedFoods={settings.avoidedFoods}
          choices={choices}
        />
      </Section>
      <Section title="Compte">
        <form action={signOutAction}>
          <button type="submit" className={buttonClasses("secondary")}>
            Se déconnecter
          </button>
        </form>
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-5 sm:p-6">
      <h2 className="type-section">{title}</h2>
      {children}
    </section>
  );
}
