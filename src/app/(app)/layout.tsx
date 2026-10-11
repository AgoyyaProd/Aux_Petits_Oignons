import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { SideNav, SideNavShell, TabBar, TabBarShell } from "@/components/layout/app-nav";
import { iconButtonClasses } from "@/components/ui/button";
import { LogOutIcon, SettingsIcon } from "@/components/ui/icons";
import { signOutAction } from "@/server/modules/auth/actions";
import { getCurrentContext } from "@/server/modules/auth/session";

/**
 * Coquille de l'application, statique et prérendue :
 *  - ordinateur (lg) : barre latérale vert forêt, contenu à droite ;
 *  - téléphone et tablette : barre du haut compacte, onglets en bas.
 * Les données de session arrivent derrière des frontières Suspense ; chaque page vérifie
 * elle-même la session via getCurrentContext() (le proxy n'est qu'un confort).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="bg-nav text-nav-foreground sticky top-0 hidden h-dvh w-68 shrink-0 flex-col gap-10 px-4 py-7 lg:flex">
        <Link href="/dashboard" className="px-3" aria-label="Aux Petits Oignons, accueil">
          <Logo tone="inverse" size={30} />
        </Link>
        <Suspense fallback={<SideNavShell pathname={null} />}>
          <SideNav />
        </Suspense>
        <div className="flex flex-col gap-1 px-1">
          <Suspense fallback={<span className="h-5" />}>
            <HouseholdName className="text-nav-muted px-3 text-sm" />
          </Suspense>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-nav-foreground flex min-h-11 w-full items-center gap-3 rounded-full px-3 text-sm font-medium hover:bg-white/8"
            >
              <LogOutIcon size={18} />
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-background/95 sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-2.5 backdrop-blur lg:hidden">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <LogoMark size={30} />
            <span className="flex min-w-0 flex-col">
              <span className="font-display text-[1.0625rem] leading-tight font-semibold">
                Aux Petits Oignons
              </span>
              <Suspense fallback={<span className="h-4" />}>
                <HouseholdName className="text-muted truncate text-xs" />
              </Suspense>
            </span>
          </Link>
          <Link href="/settings" aria-label="Paramètres" className={iconButtonClasses()}>
            <SettingsIcon size={20} />
          </Link>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
          {children}
        </main>
      </div>

      <Suspense fallback={<TabBarShell pathname={null} />}>
        <TabBar />
      </Suspense>
    </div>
  );
}

async function HouseholdName({ className }: { className: string }) {
  const { household } = await getCurrentContext();
  if (!household) return null;
  return <span className={className}>{household.name}</span>;
}
