import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { SideNav, SideNavShell, TabBar, TabBarShell } from "@/components/layout/app-nav";
import { iconButtonClasses } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/icons";
import { getCurrentContext } from "@/server/modules/auth/session";
import { OfflineBanner } from "@/components/pwa/offline-banner";

/**
 * Coquille de l'application, statique et prérendue :
 *  - ordinateur (lg) : barre latérale claire (logo, rubriques, compte en bas) ;
 *  - téléphone et tablette : en-tête léger, cinq onglets en bas.
 * Les données de session arrivent derrière des frontières Suspense ; chaque page vérifie
 * elle-même la session via getCurrentContext() (le proxy n'est qu'un confort).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="border-border bg-surface sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-r px-4 py-6 lg:flex print:hidden">
        <Link
          href="/dashboard"
          aria-label="Aux Petits Oignons, accueil"
          className="self-start px-2"
        >
          <Logo size={52} />
        </Link>
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<SideNavShell pathname={null} />}>
            <SideNav />
          </Suspense>
        </div>
        <Link
          href="/settings"
          className="border-border hover:bg-surface-muted flex items-center gap-3 rounded-xl border p-2.5 transition-colors"
        >
          <Suspense fallback={<AccountCardFallback />}>
            <AccountCard />
          </Suspense>
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <header className="border-border bg-background/95 sticky top-0 z-20 border-b backdrop-blur lg:hidden print:hidden">
          <div className="flex w-full items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
            <Link href="/dashboard" aria-label="Aux Petits Oignons, accueil" className="shrink-0">
              <Logo size={40} />
            </Link>
            <Link
              href="/recipes"
              aria-label="Rechercher une recette"
              className={iconButtonClasses()}
            >
              <SearchIcon size={20} />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[120rem] flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-12 lg:pt-12 lg:pb-20 xl:px-16 print:p-0">
          {children}
        </main>
      </div>

      <div className="print:hidden">
        <Suspense fallback={<TabBarShell pathname={null} />}>
          <TabBar />
        </Suspense>
      </div>
    </div>
  );
}

function Initial({ letter }: { letter: string }) {
  return (
    <span
      aria-hidden="true"
      className="bg-forest text-cream grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold"
    >
      {letter}
    </span>
  );
}

function AccountCardFallback() {
  return (
    <>
      <Initial letter="·" />
      <span className="text-sm font-semibold">Mon compte</span>
    </>
  );
}

async function AccountCard() {
  const { profile, household } = await getCurrentContext();
  const name = profile.displayName?.trim() || "Mon compte";
  return (
    <>
      <Initial letter={name.charAt(0).toUpperCase()} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{name}</span>
        {household ? <span className="text-muted truncate text-xs">{household.name}</span> : null}
      </span>
    </>
  );
}
