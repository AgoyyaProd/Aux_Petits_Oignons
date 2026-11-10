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

/**
 * Pied de page commun : la marque, les sources de données (dont l'attribution est exigée
 * par leurs licences) et quelques liens. Entièrement statique : pas de date calculée, pour
 * rester prérendu.
 */
export function SiteFooter({
  links,
  className = "",
}: {
  links: readonly FooterLink[];
  className?: string;
}) {
  return (
    <footer className={`border-border text-muted border-t text-sm print:hidden ${className}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <Logo size={40} />
          <p className="max-w-xs">La cuisine du quotidien, bien pensée.</p>
        </div>

        <div className="flex max-w-md flex-col gap-1.5 leading-relaxed">
          <p className="text-foreground font-semibold">Sources des données</p>
          <p>
            Valeurs nutritionnelles :{" "}
            <a
              href="https://ciqual.anses.fr"
              className="hover:text-foreground underline"
              target="_blank"
              rel="noreferrer"
            >
              table Ciqual 2025 de l&apos;Anses
            </a>{" "}
            (Licence Ouverte Etalab).
          </p>
          <p>
            Prix indicatifs :{" "}
            <a
              href="https://prices.openfoodfacts.org"
              className="hover:text-foreground underline"
              target="_blank"
              rel="noreferrer"
            >
              Open Prices
            </a>{" "}
            d&apos;Open Food Facts (licence ODbL), complétés par vos propres prix.
          </p>
        </div>

        <nav aria-label="Pied de page" className="flex flex-col gap-1.5">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
