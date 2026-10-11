"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { BasketIcon, BookIcon, CalendarIcon, HomeIcon, UserIcon } from "@/components/ui/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
interface NavItem {
  href: string;
  label: string;
  /** Autres chemins qui activent l'onglet (ex. le garde-manger sous « Profil » sur téléphone). */
  also?: readonly string[];
}

/** Barre du haut (ordinateur) : les rubriques de l'application, dans l'ordre d'usage. */
export const TOP: readonly NavItem[] = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/recipes", label: "Recettes" },
  { href: "/planner", label: "Menu" },
  { href: "/shopping", label: "Courses" },
  { href: "/pantry", label: "Garde-manger" },
  { href: "/budget", label: "Budget" },
];

/** Onglets (téléphone) : cinq entrées à portée de pouce. */
const TABS: readonly (NavItem & { icon: Icon })[] = [
  { href: "/dashboard", label: "Accueil", icon: HomeIcon },
  { href: "/recipes", label: "Recettes", icon: BookIcon },
  { href: "/planner", label: "Menu", icon: CalendarIcon },
  { href: "/shopping", label: "Liste", icon: BasketIcon },
  {
    href: "/settings",
    label: "Profil",
    icon: UserIcon,
    also: ["/pantry", "/budget", "/prices"],
  },
];

function isActive(pathname: string | null, item: NavItem) {
  if (pathname === null) return false;
  return [item.href, ...(item.also ?? [])].some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

/**
 * usePathname() lit l'URL de la requête : avec les Cache Components, ces composants sont
 * rendus dans un <Suspense> dont le repli est la version « Shell » (sans onglet actif).
 */
export function TopNav() {
  return <TopNavShell pathname={usePathname()} />;
}
export function TabBar() {
  return <TabBarShell pathname={usePathname()} />;
}

/** Rubriques de la barre du haut : l'onglet actif est souligné en terracotta. */
export function TopNavShell({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Navigation principale">
      <ul className="flex items-center gap-1">
        {TOP.map((it) => {
          const active = isActive(pathname, it);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "relative flex min-h-11 items-center px-3 text-[0.9375rem] font-medium transition-colors",
                  "after:bg-accent after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:transition-opacity",
                  active
                    ? "text-foreground after:opacity-100"
                    : "text-muted hover:text-foreground after:opacity-0",
                ].join(" ")}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Barre d'onglets (téléphone) : en bas, icône + libellé, l'onglet actif en terracotta. */
export function TabBarShell({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map((it) => {
          const active = isActive(pathname, it);
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold",
                  active ? "text-accent-strong" : "text-muted",
                ].join(" ")}
              >
                <Icon size={23} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
