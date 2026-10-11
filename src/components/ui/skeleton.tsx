/** Squelette générique pendant le chargement d'une zone dépendant de la session. */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className="bg-border/70 h-10 w-2/3 max-w-sm animate-pulse rounded-lg" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-border/50 h-24 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}

/** Annonce le chargement aux lecteurs d'écran sans contenu visuel superflu. */
export function LoadingStatus({ label = "Chargement…" }: { label?: string }) {
  return (
    <p role="status" className="sr-only">
      {label}
    </p>
  );
}

/** Indicateur de chargement en ligne (dans un bouton, une zone qui se met à jour). */
export function Spinner({ label }: { label?: string }) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      />
      {label ? <span>{label}</span> : null}
    </span>
  );
}
