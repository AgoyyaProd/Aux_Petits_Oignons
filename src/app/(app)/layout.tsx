import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AppNav } from "@/components/layout/app-nav";
import { buttonClasses } from "@/components/ui/button";
import { signOutAction } from "@/server/modules/auth/actions";
import { getCurrentContext } from "@/server/modules/auth/session";

/**
 * Coquille statique de l'application : elle se prérend et s'affiche immédiatement.
 * Les données de session (nom du foyer, contenu des pages) arrivent derrière
 * des frontières Suspense. Chaque page vérifie elle-même la session via
 * getCurrentContext() : le proxy n'est qu'un confort de navigation.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-border bg-surface/90 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 flex-col">
          <Link href="/dashboard" className="text-brand text-base font-bold tracking-tight">
            Garde-manger
          </Link>
          <Suspense fallback={<span className="text-muted h-4 text-xs" />}>
            <HouseholdName />
          </Suspense>
        </div>
        <form action={signOutAction}>
          <button type="submit" className={buttonClasses("ghost", "min-h-9 px-3 text-xs")}>
            Se déconnecter
          </button>
        </form>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="md:w-56 md:shrink-0">
          <AppNav />
        </div>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 md:pb-6">{children}</main>
      </div>
    </div>
  );
}

async function HouseholdName() {
  const { household } = await getCurrentContext();
  if (!household) return null;
  return <span className="text-muted truncate text-xs">{household.name}</span>;
}
