import Link from "next/link";
import { Logo } from "@/components/brand/logo";

interface FooterLink {
  href: string;
  label: string;
}

/** Liens du pied de page dans l'application (utilisateur connecté). */
export const APP_FOOTER_LINKS: readonly FooterLink[] = [
  { href: "/recipes", label: "Recettes" },
  { href: "/planner", label: "Menu de la semaine" },
  { href: "/prices", label: "Prix" },
  { href: "/settings", label: "Paramètres" },
];

/** Liens du pied de page sur les pages publiques. */
export const PUBLIC_FOOTER_LINKS: readonly FooterLink[] = [
  { href: "/login", label: "Se connecter" },
  { href: "/signup", label: "Créer un compte" },
];

const sourceLink = "hover:text-foreground underline underline-offset-2";

/**
 * Pied de page commun, sur toute la largeur de la page : la marque, les sources de données
 * (dont l'attribution est exigée par leurs licences) et quelques liens. Chaque texte tient
 * sur une ligne : une seule rangée sur grand écran (xl), deux rangées en dessous (marque et
 * liens, puis sources).
 * Entièrement statique (pas de date calculée) pour rester prérendu.
 */
export function SiteFooter({
  links,
  className = "",
}: {
  links: readonly FooterLink[];
  className?: string;
}) {
  return (
    <footer
      className={`border-border bg-surface text-muted relative w-full border-t text-sm print:hidden ${className}`}
    >
      <div className="flex w-full flex-col gap-5 px-4 py-7 sm:px-6 lg:px-12 xl:flex-row xl:items-center xl:justify-between xl:gap-10 xl:px-16">
        {/* Marque et liens sur une ligne, jusqu'au grand écran où les sources s'intercalent. */}
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 xl:contents">
          <div className="flex shrink-0 items-center gap-4 xl:order-1">
            <Logo size={40} />
            <p className="hidden whitespace-nowrap sm:block">
              La cuisine du quotidien, bien pensée.
            </p>
          </div>
          <nav
            aria-label="Pied de page"
            className="flex shrink-0 flex-wrap gap-x-6 gap-y-2 xl:order-3"
          >
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-foreground whitespace-nowrap">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-border flex flex-col gap-1 border-t pt-5 sm:flex-row sm:flex-wrap sm:gap-x-6 xl:order-2 xl:border-0 xl:pt-0">
          <p className="whitespace-nowrap">
            Nutrition :{" "}
            <a
              href="https://ciqual.anses.fr"
              className={sourceLink}
              target="_blank"
              rel="noreferrer"
            >
              Ciqual 2025, Anses
            </a>{" "}
            (Licence Ouverte)
          </p>
          <p className="whitespace-nowrap">
            Prix :{" "}
            <a
              href="https://prices.openfoodfacts.org"
              className={sourceLink}
              target="_blank"
              rel="noreferrer"
            >
              Open Prices, Open Food Facts
            </a>{" "}
            (ODbL)
          </p>
        </div>
      </div>
    </footer>
  );
}
