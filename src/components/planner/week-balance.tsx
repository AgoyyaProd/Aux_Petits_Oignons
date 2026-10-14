import type { ReactNode } from "react";
import { CheckIcon, AlertIcon } from "@/components/ui/icons";
import {
  balanceStatuses,
  PNNS,
  roundNutrient,
  type BalanceStatus,
  type Nutrient,
  type WeekBalance,
} from "@/domain/nutrition";

const AVERAGES: { key: Nutrient; label: string; unit: string }[] = [
  { key: "kcal", label: "Énergie", unit: "kcal" },
  { key: "proteins", label: "Protéines", unit: "g" },
  { key: "fiber", label: "Fibres", unit: "g" },
  { key: "salt", label: "Sel", unit: "g" },
];

function fmt(n: Nutrient, v: number): string {
  return roundNutrient(n, v).toLocaleString("fr-FR");
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

/**
 * Équilibre du menu : moyennes par portion (Ciqual) et repères hebdomadaires du PNNS.
 * Calculé uniquement sur les repas du menu ; les autres repas de la semaine ne sont pas connus.
 */
export function WeekBalancePanel({
  balance,
  protein,
}: {
  balance: WeekBalance | null;
  /** Objectif de protéines du foyer : repas mesurés et repas qui l'atteignent. */
  protein?: { target: number; measured: number; reached: number } | null;
}) {
  if (!balance || balance.meals === 0) return null;
  const s = balanceStatuses(balance);
  const avg = balance.averagePerPortion;

  return (
    <section
      aria-labelledby="equilibre-titre"
      className="bg-surface border-border flex flex-col gap-6 rounded-2xl border p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id="equilibre-titre" className="type-section">
          Équilibre de la semaine
        </h2>
        <p className="text-muted text-sm">
          Sur les {plural(balance.meals, "repas", "repas")} de ce menu, par personne.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-10">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Moyenne par portion</h3>
          {avg ? (
            <dl className="grid grid-cols-2 gap-3">
              {AVERAGES.map(({ key, label, unit }) => (
                <div key={key} className="bg-surface-muted rounded-xl px-4 py-3">
                  <dt className="text-muted text-xs">{label}</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {avg[key].partial ? "≥ " : ""}
                    {fmt(key, avg[key].value)}
                    {" "}
                    <span className="text-muted text-sm font-normal">{unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted text-sm">Pas assez de données pour estimer ces repas.</p>
          )}
          {balance.unmeasured.length ? (
            <p className="text-muted text-xs leading-relaxed">
              Non comptés dans la moyenne (données insuffisantes) : {balance.unmeasured.join(", ")}.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Repères de la semaine</h3>
          <ul className="flex flex-col gap-2">
            {protein && protein.measured > 0 ? (
              <Marker
                status={protein.reached === protein.measured ? "ok" : "low"}
                label={`Protéines : ${protein.target} g par part`}
                value={`${protein.reached} repas sur ${protein.measured}`}
                target="ton objectif (Paramètres)"
              />
            ) : null}
            <Marker
              status={s.fish}
              label="Poisson ou fruits de mer"
              value={plural(balance.fishMeals, "repas", "repas")}
              target={`repère : ${PNNS.fishMealsPerWeek} fois par semaine`}
            />
            <Marker
              status={s.legumes}
              label="Légumes secs"
              value={plural(balance.legumeMeals, "repas", "repas")}
              target={`repère : au moins ${PNNS.legumeMealsPerWeek} fois par semaine`}
            />
            <Marker
              status={s.redMeat}
              label="Viande (hors volaille)"
              value={`${balance.redMeatG.partial ? "≥ " : ""}${Math.round(balance.redMeatG.value)} g`}
              target={`repère : ${PNNS.redMeatMaxGPerWeek} g maximum par semaine`}
            />
            <Marker
              status={s.charcuterie}
              label="Charcuterie"
              value={`${balance.charcuterieG.partial ? "≥ " : ""}${Math.round(balance.charcuterieG.value)} g`}
              target={`repère : ${PNNS.charcuterieMaxGPerWeek} g maximum par semaine`}
            />
            <li className="text-muted flex items-baseline justify-between gap-3 px-3 text-sm">
              <span>Repas végétariens</span>
              <span className="text-foreground font-semibold tabular-nums">
                {balance.vegetarianMeals}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <p className="text-muted text-xs leading-relaxed">
        Repères du Programme national nutrition santé (mangerbouger.fr) pour un adulte. Quantités
        crues, par portion ; valeurs nutritionnelles estimées avec la table Ciqual de l&apos;Anses.
        Les repas pris en dehors de ce menu ne sont pas comptés.
      </p>
    </section>
  );
}

function Marker({
  status,
  label,
  value,
  target,
}: {
  status: BalanceStatus;
  label: string;
  value: string;
  target: string;
}) {
  const ok = status === "ok";
  const icon: ReactNode = ok ? <CheckIcon size={16} /> : <AlertIcon size={16} />;
  return (
    <li
      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${ok ? "bg-leaf-soft" : "bg-highlight-soft"}`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${ok ? "text-success" : "text-warning"}`}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-semibold tabular-nums">{value}</span>
        </span>
        <span className="text-muted text-xs">
          {target}
          {ok ? "" : status === "low" ? " · un peu juste" : " · au-dessus"}
        </span>
      </span>
    </li>
  );
}
