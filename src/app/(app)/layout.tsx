import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { TabBar, TabBarShell, TopNav, TopNavShell } from "@/components/layout/app-nav";
import { buttonClasses, iconButtonClasses } from "@/components/ui/button";
import { SearchIcon, UserIcon } from "@/components/ui/icons";
import { getCurrentContext } from "@/server/modules/auth/session";

/**
 * Coquille de l'application, statique et prérendue :
 *  - ordinateur (lg) : barre du haut avec logo, rubriques, recherche et profil ;
 *  - téléphone et tablette : en-tête léger, cinq onglets en bas.
 * Les données de session arrivent derrière des frontières Suspense ; chaque page vérifie
 * elle-même la session via getCurrentContext() (le proxy n'est qu'un confort).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-border bg-background/95 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:py-3">
          <Link href="/dashboard" aria-label="Aux Petits Oignons, accueil" className="shrink-0">
            <Logo size={38} />
          </Link>
          <div className="hidden lg:block">
            <Suspense fallback={<TopNavShell pathname={null} />}>
              <TopNav />
            </Suspense>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/recipes"
              aria-label="Rechercher une recette"
              className={iconButtonClasses()}
            >
              <SearchIcon size={20} />
            </Link>
            <Link href="/settings" className={buttonClasses("forest", "hidden lg:inline-flex")}>
              <UserIcon size={18} />
              <Suspense fallback="Mon profil">
                <ProfileLabel />
              </Suspense>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:pt-10 lg:pb-16">
        {children}
      </main>
      <Suspense fallback={<TabBarShell pathname={null} />}>
        <TabBar />
      </Suspense>
    </div>
  );
}

async function ProfileLabel() {
  const { profile } = await getCurrentContext();
  return <>{profile.displayName ?? "Mon profil"}</>;
}
