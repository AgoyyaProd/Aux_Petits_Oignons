import type { ReactNode } from "react";

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
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
