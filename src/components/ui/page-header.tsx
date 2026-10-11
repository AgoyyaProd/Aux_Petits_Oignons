import type { ReactNode } from "react";

/**
 * Rangée d'actions d'un écran : sur téléphone, une grille de deux boutons pleine largeur
 * (un bouton seul en dernière position prend toute la ligne) ; à partir de sm, une ligne.
 */
export const ACTIONS_ROW =
  "grid w-full grid-cols-2 gap-2 [&>*]:w-full [&>*:last-child:nth-child(odd)]:col-span-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:[&>*]:w-auto";

/** Libellé court sur téléphone, long à partir de sm. */
export function Responsive({ short, long }: { short: ReactNode; long: ReactNode }) {
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="max-sm:hidden">{long}</span>
    </>
  );
}

/** En-tête d'écran : titre éditorial, phrase d'aide facultative, actions à droite. */
export function PageHeader({
  title,
  description,
  actions,
  kicker,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Petit contexte au-dessus du titre (date, semaine), seulement s'il informe. */
  kicker?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex max-w-2xl min-w-0 flex-col gap-2">
        {kicker ? <p className="text-accent-strong text-sm font-semibold">{kicker}</p> : null}
        <h1 className="type-page">{title}</h1>
        {description ? <p className="text-muted leading-relaxed">{description}</p> : null}
      </div>
      {actions ? <div className={ACTIONS_ROW}>{actions}</div> : null}
    </header>
  );
}
