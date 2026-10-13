import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { buttonClasses } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getCurrentContext } from "@/server/modules/auth/session";
import { skipOnboardingAction } from "@/server/modules/households/actions";
import { getHouseholdSettings } from "@/server/modules/households/queries";

export const metadata: Metadata = { title: "Bienvenue" };

/**
 * Questionnaire de bienvenue : proposé automatiquement à la première connexion (depuis
 * l'accueil du compte), et rejouable à tout moment depuis les paramètres.
 */
export default function WelcomePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Welcome />
    </Suspense>
  );
}

async function Welcome() {
  const [{ profile }, settings] = await Promise.all([getCurrentContext(), getHouseholdSettings()]);
  if (!settings) return <p className="text-muted">Aucun foyer actif.</p>;
  const replay = profile.onboardedAt !== null;
  const h = settings.household;

  return (
    <OnboardingWizard
      householdId={h.id}
      householdName={h.name}
      isOwner={settings.isOwner}
      replay={replay}
      displayName={profile.displayName ?? ""}
      peopleCount={h.people_count}
      weeklyBudgetCents={h.weekly_budget_cents}
      maxPrepMinutes={h.max_prep_minutes}
      mealSlots={h.meal_slots}
      mealsPerCook={h.meals_per_cook}
      style={settings.foodProfile.style}
      noPork={settings.foodProfile.noPork}
      allergens={settings.selectedAllergens}
      objectives={settings.foodProfile.objectives}
      equipment={settings.foodProfile.equipment}
      allergenOptions={settings.allergens}
      equipmentOptions={settings.equipmentOptions}
      skip={
        replay ? (
          <Link href="/settings" className={buttonClasses("text")}>
            Annuler
          </Link>
        ) : (
          <form action={skipOnboardingAction}>
            <button type="submit" className={buttonClasses("text")}>
              Plus tard
            </button>
          </form>
        )
      }
    />
  );
}
