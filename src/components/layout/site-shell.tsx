import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { PageShapes } from "@/components/brand/page-shapes";
import {
  SideNav,
  SideNavShell,
  SIDEBAR,
  TabBar,
  TabBarShell,
  VISITOR_SIDEBAR,
} from "@/components/layout/app-nav";
import { APP_FOOTER_LINKS, PUBLIC_FOOTER_LINKS, SiteFooter } from "@/components/layout/site-footer";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { buttonClasses, iconButtonClasses } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Coquille unique du site, la même pour un visiteur et pour un membre connecté :
 *  - ordinateur (lg) : barre latérale (logo et thème, rubriques, compte en bas) ;
 *  - téléphone et tablette : en-tête léger ; cinq onglets en bas pour un membre.
 * Seuls changent les rubriques et le bas de la barre : la carte du compte pour un membre,
 * « Se connecter » et « Créer un compte » pour un visiteur.
 * Statique et prérendue : la carte du compte arrive derrière une frontière Suspense.
 */
export function SiteShell({
  member,
  account,
  children,
}: {
  /** Membre connecté (rubriques du compte) ou visiteur (rubriques de la page d'accueil). */
  member: boolean;
  /** Carte du compte (membre seulement), rendue côté serveur par l'appelant. */
  account?: ReactNode;
  children: ReactNode;
}) {
  const home = member ? "/dashboard" : "/";
  const items = member ? SIDEBAR : VISITOR_SIDEBAR;
  return (
    <div className="relative isolate flex min-h-full flex-1 flex-col">
      {member ? (
        <Suspense fallback={null}>
          <PageShapes />
        </Suspense>
      ) : null}
      <div className="flex flex-1">
        <aside className="border-border bg-surface sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-r px-4 py-6 lg:flex print:hidden">
          <div className="flex items-start justify-between gap-2 px-2">
            <Link href={home} aria-label="Aux Petits Oignons, accueil">
              <Logo size={52} />
            </Link>
            <ThemeToggle />
          </div>
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<SideNavShell pathname={null} items={items} />}>
              <SideNav items={items} />
            </Suspense>
          </div>
          {member ? (
            account
          ) : (
            <div className="border-border flex flex-col gap-2 rounded-xl border p-3">
              <p className="text-muted px-1 text-sm leading-snug">
                Ton garde-manger, tes menus et tes courses au même endroit.
              </p>
              <Link href="/signup" className={buttonClasses("forest", "w-full")}>
                Créer un compte
              </Link>
              <Link href="/login" className={buttonClasses("secondary", "w-full")}>
                Se connecter
              </Link>
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <OfflineBanner />
          <header className="border-border bg-background/95 sticky top-0 z-20 border-b backdrop-blur lg:hidden print:hidden">
            <div className="flex w-full items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
              <Link href={home} aria-label="Aux Petits Oignons, accueil" className="shrink-0">
                <Logo size={40} />
              </Link>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {member ? (
                  <Link
                    href="/recipes"
                    aria-label="Rechercher une recette"
                    className={iconButtonClasses()}
                  >
                    <SearchIcon size={20} />
                  </Link>
                ) : (
                  <Link href="/login" className={buttonClasses("secondary", "px-4")}>
                    Se connecter
                  </Link>
                )}
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[120rem] flex-1 px-4 pt-6 pb-12 sm:px-6 lg:px-12 lg:pt-12 lg:pb-16 xl:px-16 print:p-0">
            {children}
          </main>
        </div>
      </div>

      {/* Toute la largeur, sous la barre latérale. Sur téléphone, la marge du bas laisse la
          place à la barre d'onglets fixe des membres. */}
      <SiteFooter
        links={member ? APP_FOOTER_LINKS : PUBLIC_FOOTER_LINKS}
        className={member ? "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0" : ""}
      />

      {member ? (
        <div className="print:hidden">
          <Suspense fallback={<TabBarShell pathname={null} />}>
            <TabBar />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}
