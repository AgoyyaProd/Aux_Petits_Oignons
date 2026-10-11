"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Écrans prévus au MVP ; ceux qui n'existent pas encore sont signalés « bientôt ». */
const ITEMS = [
  { href: "/dashboard", label: "Accueil", ready: true },
  { href: "/pantry", label: "Garde-manger", ready: true },
  { href: "/recipes", label: "Recettes", ready: true },
  { href: "/planner", label: "Menu", ready: true },
  { href: "/shopping", label: "Courses", ready: true },
] as const;

/**
 * Navigation avec l'onglet actif. usePathname() lit l'URL de la requête :
 * avec les Cache Components, ce composant doit être rendu dans un <Suspense>
 * dont le repli est <AppNavShell pathname={null} /> (même rendu, sans onglet actif).
 */
export function AppNav() {
  return <AppNavShell pathname={usePathname()} />;
}

/** Rendu pur de la navigation, sans lecture d'URL. */
export function AppNavShell({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-10 border-t pb-[env(safe-area-inset-bottom)] md:static md:border-t-0 md:border-r md:bg-transparent md:pb-0"
    >
      <ul className="mx-auto flex max-w-lg justify-between md:max-w-none md:flex-col md:gap-1 md:p-3">
        {ITEMS.map((item) => {
          const active =
            pathname !== null && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          if (!item.ready) {
            return (
              <li key={item.href} className="flex-1 md:flex-none">
                <span
                  aria-disabled="true"
                  className="text-muted/60 flex min-h-14 flex-col items-center justify-center px-1 text-xs md:min-h-10 md:flex-row md:justify-start md:gap-2 md:rounded-lg md:px-3 md:text-sm"
                >
                  {item.label}
                  <span className="text-[10px] md:text-xs">bientôt</span>
                </span>
              </li>
            );
          }
          return (
            <li key={item.href} className="flex-1 md:flex-none">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-14 items-center justify-center px-1 text-xs font-medium md:min-h-10 md:justify-start md:rounded-lg md:px-3 md:text-sm",
                  active ? "text-brand md:bg-brand-soft" : "text-foreground hover:text-brand",
                ].join(" ")}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
