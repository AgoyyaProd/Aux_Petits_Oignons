/** Semaines du lundi au dimanche, en dates ISO « AAAA-MM-JJ » sans fuseau. */

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO.test(value)) return false;
  const d = toDate(value);
  return !Number.isNaN(d.getTime()) && toIso(d) === value;
}

export function addDays(iso: string, days: number): string {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

/** Lundi de la semaine contenant la date. */
export function mondayOf(iso: string): string {
  const day = toDate(iso).getUTCDay(); // 0 = dimanche
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

export function isMonday(iso: string): boolean {
  return isIsoDate(iso) && toDate(iso).getUTCDay() === 1;
}

const dayMonth = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** « Semaine du 12 au 18 octobre ». */
export function formatWeek(monday: string): string {
  const sunday = addDays(monday, 6);
  // « 1er novembre », comme on l'écrit en français.
  const label = (iso: string) => dayMonth.format(toDate(iso)).replace(/^1 /, "1er ");
  const [from, to] = [label(monday), label(sunday)];
  const sameMonth = monday.slice(5, 7) === sunday.slice(5, 7);
  return `Semaine du ${sameMonth ? from.split(" ")[0] : from} au ${to}`;
}

const weekdayDay = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  timeZone: "UTC",
});

/** « Lundi 12 » (« Samedi 1er »). */
export function formatDay(iso: string): string {
  const label = weekdayDay.format(toDate(iso)).replace(/ 1$/, " 1er");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** « Lundi 12 midi », « Mardi 13 soir ». */
export function formatSlot(day: string, slot: "lunch" | "dinner"): string {
  return `${formatDay(day)} ${slot === "lunch" ? "midi" : "soir"}`;
}
