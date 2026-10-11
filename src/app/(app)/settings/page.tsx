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
import {
  ChevronRightIcon,
  PantryIcon,
  SettingsIcon,
  TagIcon,
  UsersIcon,
  WalletIcon,
  LeafIcon,
} from "@/components/ui/icons";
import { formatCents } from "@/domain/money";
import { getCurrentContext } from "@/server/modules/auth/session";
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
  const [{ user, profile }, settings, members, choices] = await Promise.all([
    getCurrentContext(),
    getHouseholdSettings(),
    getMembersSection(),
    getIngredientChoices(),
  ]);
  if (!settings || !members) return <p className="text-muted">Aucun foyer actif.</p>;

  return (
    <>
      <ProfileCard
        name={profile.displayName}
        email={user.email ?? null}
        household={settings.household.name}
        people={settings.household.people_count}
        budget={settings.household.weekly_budget_cents}
      />
      <Section title="Foyer" id="foyer">
        <HouseholdForm household={settings.household} isOwner={settings.isOwner} />
      </Section>
      <Section title="Membres du foyer" id="membres">
        <MembersSection
          householdId={members.householdId}
          isOwner={members.isOwner}
          members={members.members}
          invitations={members.invitations}
          households={members.households}
        />
      </Section>
      <Section title="Régimes et allergies" id="preferences">
        <PreferencesForm
          householdId={settings.household.id}
          diets={settings.diets}
          allergens={settings.allergens}
          selectedDiets={settings.selectedDiets}
          selectedAllergens={settings.selectedAllergens}
        />
      </Section>
      <Section title="Budget, prix et magasin" id="budget">
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
      <Section title="Aliments que tu ne veux pas manger" id="aliments">
        <AvoidedFoodsForm
          householdId={settings.household.id}
          avoidedFoods={settings.avoidedFoods}
          choices={choices}
        />
      </Section>
      <Section title="Compte" id="compte">
        <form action={signOutAction}>
          <button type="submit" className={buttonClasses("secondary")}>
            Se déconnecter
          </button>
        </form>
      </Section>
    </>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="border-border bg-surface flex scroll-mt-24 flex-col gap-5 rounded-2xl border p-5 sm:p-6"
    >
      <h2 className="type-section">{title}</h2>
      {children}
    </section>
  );
}

/** En-tête du profil (téléphone et ordinateur) : identité et accès rapides. */
function ProfileCard({
  name,
  email,
  household,
  people,
  budget,
}: {
  name: string | null;
  email: string | null;
  household: string;
  people: number;
  budget: number | null;
}) {
  const initial = (name ?? email ?? "?").trim().charAt(0).toUpperCase();
  const rows = [
    {
      href: "#preferences",
      icon: LeafIcon,
      label: "Mes préférences alimentaires",
      sub: "Régimes, allergies, aliments évités",
    },
    {
      href: "#foyer",
      icon: UsersIcon,
      label: "Taille du foyer",
      sub: `${people} personne${people > 1 ? "s" : ""}, ${household}`,
    },
    {
      href: "/budget",
      icon: WalletIcon,
      label: "Budget hebdomadaire",
      sub: budget !== null ? formatCents(budget) : "Non fixé",
    },
    {
      href: "/pantry",
      icon: PantryIcon,
      label: "Mon garde-manger",
      sub: "Frigo, congélateur, placards",
    },
    {
      href: "/prices",
      icon: TagIcon,
      label: "Mes prix",
      sub: "Magasin de référence et prix saisis",
    },
    {
      href: "#membres",
      icon: SettingsIcon,
      label: "Membres et invitations",
      sub: "Partager le foyer",
    },
  ];
  return (
    <section aria-label="Mon profil" className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="bg-accent-soft text-accent-strong font-display flex size-16 shrink-0 items-center justify-center rounded-full text-2xl font-semibold">
          {initial}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-semibold">{name ?? "Mon profil"}</span>
          {email ? <span className="text-muted truncate text-sm">{email}</span> : null}
        </span>
      </div>
      <ul className="border-border bg-surface divide-border divide-y rounded-2xl border">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <li key={r.href}>
              <a
                href={r.href}
                className="hover:bg-surface-muted flex min-h-16 items-center gap-4 px-4 py-3"
              >
                <span className="text-muted">
                  <Icon size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{r.label}</span>
                  <span className="text-muted truncate text-sm">{r.sub}</span>
                </span>
                <ChevronRightIcon size={18} className="text-muted" />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
