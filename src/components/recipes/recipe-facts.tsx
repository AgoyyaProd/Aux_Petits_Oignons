import type { ReactNode } from "react";
import {
  AlertIcon,
  ClockIcon,
  GaugeIcon,
  FlameIcon,
  PotIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { formatCents } from "@/domain/money";
import { DIFFICULTY_LABEL, DIFFICULTY_RULE, type Difficulty } from "@/domain/recipes/difficulty";

const DIFFICULTY_LEVEL: Record<Difficulty, number> = { facile: 1, moyenne: 2, elaboree: 3 };

export interface RecipeFactsProps {
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  stepCount: number;
  difficulty: Difficulty;
  /** Coût estimé de toute la recette ; missingNames = ingrédients sans prix connu. */
  cost: { cents: number; missingNames: string[] } | null;
  /** Énergie par portion, seulement si l'estimation nutritionnelle est fiable. */
  kcal: { value: number; partial: boolean } | null;
  equipmentLabels: string[];
  allergenLabels: string[];
}

/** Durée lisible, insécable : « 45 min », « 2 h 50 ». */
function minutes(m: number): string {
  if (m < 60) return `${m}\u00a0min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}\u00a0h\u00a0${String(rest).padStart(2, "0")}` : `${h}\u00a0h`;
}

/** Montant insécable (« 24,60 € » ne se coupe pas en fin de ligne). */
function money(cents: number): string {
  return formatCents(cents).replace(/ /g, "\u00a0");
}

function Fact({
  icon,
  label,
  value,
  detail,
  title,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  title?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2" title={title}>
      <dt className="text-muted flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
        <span
          aria-hidden="true"
          className="bg-surface-muted text-foreground flex size-7 shrink-0 items-center justify-center rounded-full"
        >
          {icon}
        </span>
        {label}
      </dt>
      <dd className="flex flex-col gap-1">
        <span className="text-xl leading-tight font-semibold tabular-nums">{value}</span>
        {detail ? <span className="text-muted text-xs leading-snug">{detail}</span> : null}
      </dd>
    </div>
  );
}

/**
 * Bloc « Informations » d'une fiche recette : les quatre repères utiles pour choisir
 * (temps, difficulté, coût, énergie), puis le matériel et les allergènes.
 * Toute valeur incomplète est signalée (≥) et expliquée, jamais arrondie en silence.
 */
export function RecipeFacts(props: RecipeFactsProps) {
  const { prepMinutes, cookMinutes, servings, stepCount, difficulty, cost, kcal } = props;
  const total = prepMinutes + cookMinutes;
  const prepShare = total > 0 ? Math.round((prepMinutes / total) * 100) : 100;
  const level = DIFFICULTY_LEVEL[difficulty];
  const perServing = cost ? Math.round(cost.cents / servings) : null;
  const costPartial = (cost?.missingNames.length ?? 0) > 0;

  return (
    <section
      aria-labelledby="infos"
      className="bg-surface border-border flex flex-col gap-5 rounded-2xl border p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="infos" className="text-sm font-semibold">
          Informations
        </h2>
        <p className="text-muted text-sm">
          Pour {servings} {servings > 1 ? "personnes" : "personne"} · {stepCount}{" "}
          {stepCount > 1 ? "étapes" : "étape"}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4">
        <Fact
          icon={<ClockIcon size={15} />}
          label="Temps total"
          value={minutes(total)}
          detail={
            <span className="flex flex-col gap-1.5">
              <span
                aria-hidden="true"
                className="bg-highlight flex h-1.5 w-full max-w-32 overflow-hidden rounded-full"
              >
                <span className="bg-brand h-full" style={{ width: `${prepShare}%` }} />
              </span>
              <span className="flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="bg-brand size-1.5 rounded-full" />
                  Prépa {minutes(prepMinutes)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {cookMinutes > 0 ? (
                    <>
                      <span aria-hidden="true" className="bg-highlight size-1.5 rounded-full" />
                      Cuisson {minutes(cookMinutes)}
                    </>
                  ) : (
                    "Sans cuisson"
                  )}
                </span>
              </span>
            </span>
          }
        />
        <Fact
          icon={<GaugeIcon size={15} />}
          label="Difficulté"
          title={DIFFICULTY_RULE}
          value={DIFFICULTY_LABEL[difficulty]}
          detail={
            <span className="flex items-center gap-1" aria-label={`Niveau ${level} sur 3`}>
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={`h-1.5 w-5 rounded-full ${i <= level ? "bg-brand" : "bg-surface-muted border-border border"}`}
                />
              ))}
            </span>
          }
        />
        <Fact
          icon={<WalletIcon size={15} />}
          label="Coût estimé"
          value={
            perServing !== null ? (
              <>
                {costPartial ? "≥ " : "≈ "}
                {money(perServing)}
              </>
            ) : (
              <span className="text-muted text-base font-normal">Non estimé</span>
            )
          }
          detail={
            cost
              ? `la part · ${costPartial ? "au moins " : ""}${money(cost.cents)} la\u00a0recette`
              : "Aucun prix connu"
          }
        />
        <Fact
          icon={<FlameIcon size={15} />}
          label="Énergie"
          value={
            kcal ? (
              <>
                {kcal.partial ? "≥ " : "≈ "}
                {Math.round(kcal.value)}
                {"\u00a0"}kcal
              </>
            ) : (
              <span className="text-muted text-base font-normal">Non estimée</span>
            )
          }
          detail={
            kcal ? (
              <a href="#nutrition" className="hover:text-foreground underline underline-offset-2">
                par portion · détail
              </a>
            ) : (
              "Données insuffisantes"
            )
          }
        />
      </dl>

      <div className="border-border flex flex-col gap-3 border-t pt-4 text-sm">
        {props.equipmentLabels.length ? (
          <TagLine icon={<PotIcon size={15} />} label="Matériel" items={props.equipmentLabels} />
        ) : null}
        <TagLine
          icon={<AlertIcon size={15} />}
          label="Allergènes"
          items={props.allergenLabels}
          empty="Aucun des 14 allergènes réglementaires"
          tone="soon"
        />
        {costPartial ? (
          <p className="text-muted text-xs leading-relaxed">
            Coût minimum : pas encore de prix pour {cost!.missingNames.join(", ").toLowerCase()}.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function TagLine({
  icon,
  label,
  items,
  empty,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  items: string[];
  empty?: string;
  tone?: "neutral" | "soon";
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <span className="text-muted inline-flex items-center gap-1.5">
        <span aria-hidden="true">{icon}</span>
        {label} :
      </span>
      {items.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                tone === "soon"
                  ? "bg-highlight-soft text-warning"
                  : "bg-surface-muted border-border border"
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-xs">{empty}</span>
      )}
    </div>
  );
}
