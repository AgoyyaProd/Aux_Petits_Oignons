/** Squelette générique pendant le chargement d'une zone dépendant de la session. */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-border/60 h-20 animate-pulse rounded-2xl" />
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
