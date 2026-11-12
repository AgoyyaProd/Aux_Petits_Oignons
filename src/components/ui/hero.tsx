import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import type { ReactNode } from "react";

/**
 * En-tête « Marché » (piste C), commun à toutes les pages : bloc vert forêt plein.
 * Sur téléphone il prolonge la barre verte du haut (bord à bord, coins arrondis en bas) ;
 * sur ordinateur c'est une grande carte arrondie.
 *
 * Le `<main>` de la coquille a un pt-6 et un px-4 / sm:px-6 : les marges négatives
 * les compensent pour coller à la barre verte.
 */
export const HERO_BLEED =
  "bg-forest text-cream relative -mx-4 -mt-6 overflow-hidden rounded-b-[1.75rem] px-5 pt-2 pb-6 sm:-mx-6 sm:px-8 lg:mx-0 lg:mt-0 lg:rounded-3xl lg:px-10 lg:py-8";

/** Variante en haut d'une carte (connexion, inscription) : colle aux bords de la carte p-6 / sm:p-8. */
const HERO_CARD =
  "bg-forest text-cream relative -mx-6 -mt-6 overflow-hidden rounded-t-2xl px-6 pt-6 pb-6 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8";

/** Lien ou bouton discret posé sur le vert (pastille translucide). */
export const ON_FOREST = buttonClasses("glass", "px-4");

/** Texte secondaire lisible sur le vert. */
export const ON_FOREST_MUTED = "text-[#cfe0d4]";

export type HeroDecor = "circle" | "leaf" | "half" | "none";

/** Une forme de la charte dans le coin, qui ne passe jamais sous le titre sur téléphone. */
function Decor({ kind }: { kind: HeroDecor }) {
  if (kind === "none") return null;
  if (kind === "leaf")
    return (
      <span
        aria-hidden="true"
        className="bg-leaf absolute top-3 -right-10 hidden h-24 w-48 rotate-[-18deg] rounded-[100%_0] opacity-90 sm:block lg:-top-12 lg:-right-8 lg:h-28 lg:w-56"
      />
    );
  if (kind === "half")
    return (
      <span
        aria-hidden="true"
        className="bg-accent absolute right-[24%] -bottom-12 hidden h-24 w-48 rounded-t-full sm:block"
      />
    );
  return (
    <span
      aria-hidden="true"
      className="bg-highlight absolute -top-10 -right-12 hidden size-32 rounded-full sm:block lg:-top-10 lg:-right-10 lg:size-44"
    />
  );
}

export function Hero({
  title,
  kicker,
  description,
  actions,
  back,
  decor = "circle",
  inCard = false,
  children,
}: {
  title: ReactNode;
  /** Petit contexte au-dessus du titre (date, semaine). */
  kicker?: ReactNode;
  description?: ReactNode;
  /** Boutons à droite du titre (ON_FOREST, ou buttonClasses("primary") pour l'action principale). */
  actions?: ReactNode;
  /** Lien de retour au-dessus du titre. */
  back?: { href: string; label: string };
  decor?: HeroDecor;
  /** En haut d'une carte plutôt qu'en tête de page. */
  inCard?: boolean;
  /** Contenu sous le titre : tuiles, recherche, navigation de semaine… */
  children?: ReactNode;
}) {
  return (
    <header className={`${inCard ? HERO_CARD : HERO_BLEED} flex flex-col gap-5`}>
      {/* Avec des boutons à droite, la forme passe en bas, à l'écart des boutons. */}
      <Decor kind={actions && decor !== "none" ? "half" : decor} />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl min-w-0 flex-col gap-1.5">
          {back ? (
            <Link
              href={back.href}
              className="text-sm font-semibold text-[#a9cfb2] underline-offset-4 hover:underline"
            >
              ← {back.label}
            </Link>
          ) : null}
          {kicker ? (
            <p className="text-sm font-medium text-[#a9cfb2] first-letter:uppercase">{kicker}</p>
          ) : null}
          <h1 className="type-page text-cream">{title}</h1>
          {description ? (
            <p className={`${ON_FOREST_MUTED} text-sm leading-relaxed`}>{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="relative flex flex-col gap-4">{children}</div> : null}
    </header>
  );
}

/** Tuile chiffrée sur le vert (garde-manger, courses, budget). Active : fond crème. */
export function HeroTile({
  value,
  label,
  active = false,
}: {
  value: ReactNode;
  label: ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={[
        "flex min-h-[4.25rem] flex-col justify-center rounded-2xl px-3 transition-colors",
        active ? "bg-cream text-[#13261f]" : "text-cream bg-white/10",
      ].join(" ")}
    >
      <span className="font-display text-2xl leading-none font-semibold tabular-nums">{value}</span>
      <span className="mt-1 text-xs font-semibold">{label}</span>
    </span>
  );
}

/** Navigation de semaine sur le vert (menu, courses). */
export function HeroWeekNav({
  previous,
  next,
  label,
  sub,
}: {
  previous: string;
  next: string;
  label: ReactNode;
  sub?: ReactNode;
}) {
  const arrow =
    "text-cream inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/15";
  return (
    <nav
      aria-label="Semaine"
      className="flex items-center gap-1 rounded-full bg-white/10 p-1 sm:max-w-md"
    >
      <Link href={previous} className={arrow} aria-label="Semaine précédente">
        <ChevronLeftIcon size={20} />
      </Link>
      <span className="flex flex-1 flex-col items-center px-2 text-center">
        <span className="text-cream text-sm font-semibold">{label}</span>
        {sub ? <span className="text-xs text-[#a9cfb2]">{sub}</span> : null}
      </span>
      <Link href={next} className={arrow} aria-label="Semaine suivante">
        <ChevronRightIcon size={20} />
      </Link>
    </nav>
  );
}
