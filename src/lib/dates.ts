/** Date du jour « AAAA-MM-JJ » dans le fuseau du foyer (et non celui du serveur). */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const shortDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** « 14 oct. » pour une date ISO sans heure. */
export function formatShortDate(isoDate: string): string {
  return shortDate.format(new Date(`${isoDate}T00:00:00Z`));
}

/** « 11 oct. 2026, 13:05 » dans le fuseau donné. */
export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));
}

/** Heure (0–23) dans le fuseau du foyer. */
export function hourIn(timeZone: string, now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(now),
  );
}

/** « Mardi 13 octobre » pour une date ISO sans heure. */
export function formatLongDate(isoDate: string): string {
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })
    .format(new Date(`${isoDate}T00:00:00Z`))
    .replace(/ 1 /, " 1er ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}
