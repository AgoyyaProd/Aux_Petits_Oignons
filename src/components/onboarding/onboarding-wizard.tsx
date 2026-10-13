"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  MinusIcon,
  PlusIcon,
} from "@/components/ui/icons";
import { centsToInput, parseEurosToCents } from "@/domain/money";
import { ALL_PATTERN_SLOTS, PATTERN_PRESETS } from "@/domain/planning/pattern";
import { completeOnboardingAction } from "@/server/modules/households/actions";
import {
  EATING_STYLES,
  OBJECTIVES,
  type EQUIPMENT_CODES,
} from "@/server/modules/households/schema";

interface Option {
  code: string;
  label: string;
}

export interface OnboardingWizardProps {
  householdId: string;
  householdName: string;
  isOwner: boolean;
  /** Questionnaire déjà fait : on le refait depuis les paramètres. */
  replay: boolean;
  displayName: string;
  peopleCount: number;
  weeklyBudgetCents: number | null;
  maxPrepMinutes: number | null;
  mealSlots: string[];
  mealsPerCook: number;
  style: string;
  noPork: boolean;
  allergens: string[];
  objectives: string[];
  /** null : matériel jamais renseigné (tout est coché par défaut). */
  equipment: string[] | null;
  allergenOptions: Option[];
  equipmentOptions: Option[];
  skip: ReactNode;
}

type StepId = "foyer" | "semaine" | "regime" | "envies";

const STEP_TITLES: Record<StepId, { title: string; lead: string }> = {
  foyer: {
    title: "Faisons connaissance",
    lead: "Quelques questions pour que les menus te ressemblent dès le premier jour. Tout reste modifiable dans les paramètres.",
  },
  semaine: {
    title: "Ta semaine de repas",
    lead: "Quels repas veux-tu prévoir, et combien de repas couvre un plat cuisiné ?",
  },
  regime: {
    title: "Ce que vous mangez",
    lead: "Le régime et les allergies écartent les recettes qui ne conviennent pas.",
  },
  envies: {
    title: "Pour finir",
    lead: "Tes envies orientent les propositions ; ton matériel écarte les recettes impossibles chez toi.",
  },
};

const PRESETS: { id: keyof typeof PATTERN_PRESETS; label: string; hint: string }[] = [
  { id: "midi_et_soir", label: "Midi et soir", hint: "14 repas par semaine" },
  { id: "soir", label: "Le soir seulement", hint: "7 repas : le midi, je mange ailleurs" },
  {
    id: "semaine_soir",
    label: "Soir en semaine, midi et soir le week-end",
    hint: "9 repas par semaine",
  },
];

const PER_COOK = [
  { n: 1, label: "1 repas", hint: "Je cuisine à chaque repas." },
  { n: 2, label: "2 repas", hint: "Un plat pour le repas et le suivant." },
  { n: 3, label: "3 repas", hint: "Je cuisine en avance pour trois repas." },
];

const chip =
  "border-border bg-surface has-checked:border-forest has-checked:bg-forest has-checked:text-cream relative flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent";
const card =
  "border-border bg-surface has-checked:border-forest has-checked:bg-forest/5 has-focus-visible:outline-accent flex cursor-pointer items-start gap-3 rounded-2xl border p-4 has-focus-visible:outline-2";

function presetOf(slots: ReadonlySet<string>): keyof typeof PATTERN_PRESETS | null {
  for (const p of PRESETS) {
    const ref = PATTERN_PRESETS[p.id];
    if (ref.length === slots.size && ref.every((s) => slots.has(s))) return p.id;
  }
  return null;
}

function toggled<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/**
 * Questionnaire de bienvenue, affiché à la première connexion (et rejouable depuis les
 * paramètres). Les réponses restent dans le navigateur jusqu'au bout, puis sont enregistrées
 * en une seule transaction. Un membre invité ne voit pas les questions sur le foyer : seul
 * le propriétaire peut les modifier.
 */
export function OnboardingWizard(props: OnboardingWizardProps) {
  const steps: StepId[] = props.isOwner
    ? ["foyer", "semaine", "regime", "envies"]
    : ["foyer", "regime", "envies"];
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [name, setName] = useState(props.displayName);
  const [people, setPeople] = useState(props.peopleCount);
  const [budget, setBudget] = useState(centsToInput(props.weeklyBudgetCents));
  const [prep, setPrep] = useState(props.maxPrepMinutes ? String(props.maxPrepMinutes) : "");
  const [slots, setSlots] = useState<Set<string>>(() => new Set(props.mealSlots));
  const [perCook, setPerCook] = useState(props.mealsPerCook);
  const [style, setStyle] = useState(props.style);
  const [noPork, setNoPork] = useState(props.noPork);
  const [allergens, setAllergens] = useState(() => new Set(props.allergens));
  const [objectives, setObjectives] = useState(() => new Set(props.objectives));
  const [equipment, setEquipment] = useState(
    () => new Set(props.equipment ?? props.equipmentOptions.map((e) => e.code)),
  );
  const [fieldErrors, setFieldErrors] = useState<{ budget?: string; prep?: string }>({});

  const step = steps[index]!;
  const last = index === steps.length - 1;
  const preset = presetOf(slots);

  function goTo(i: number) {
    setError(null);
    setIndex(i);
    window.scrollTo({ top: 0 });
  }

  function parseFinal(): { budgetCents: number | null; prepMinutes: number | null } | null {
    const errors: typeof fieldErrors = {};
    let budgetCents: number | null = null;
    let prepMinutes: number | null = null;
    if (budget.trim()) {
      try {
        budgetCents = parseEurosToCents(budget);
        if (budgetCents > 10_000_000) throw new Error();
      } catch {
        errors.budget = "Montant invalide (exemple : 85 ou 85,50).";
      }
    }
    if (prep.trim()) {
      const n = Number(prep);
      if (!Number.isInteger(n) || n < 5 || n > 600) errors.prep = "Entre 5 et 600 minutes.";
      else prepMinutes = n;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length ? null : { budgetCents, prepMinutes };
  }

  function submit() {
    const parsed = props.isOwner ? parseFinal() : { budgetCents: null, prepMinutes: null };
    if (!parsed) return;
    start(async () => {
      const res = await completeOnboardingAction({
        householdId: props.householdId,
        displayName: name,
        household: props.isOwner
          ? {
              peopleCount: people,
              weeklyBudgetCents: parsed.budgetCents,
              maxPrepMinutes: parsed.prepMinutes,
              mealSlots: ALL_PATTERN_SLOTS.filter((s) => slots.has(s)),
              mealsPerCook: perCook,
            }
          : null,
        style: style as (typeof EATING_STYLES)[number]["code"],
        noPork,
        allergens: [...allergens],
        objectives: [...objectives] as (typeof OBJECTIVES)[number]["code"][],
        equipment: props.equipmentOptions
          .map((e) => e.code)
          .filter((c) => equipment.has(c)) as (typeof EQUIPMENT_CODES)[number][],
      });
      if (res.ok) {
        setDone(true);
        window.scrollTo({ top: 0 });
      } else setError(res.message);
    });
  }

  if (done) return <Done name={name.trim()} />;

  const { title, lead } = STEP_TITLES[step];
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted text-sm font-medium">
            Étape {index + 1} sur {steps.length}
          </p>
          {props.skip}
        </div>
        <div
          className="bg-border/70 flex h-1.5 gap-1 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={index + 1}
          aria-label="Avancement du questionnaire"
        >
          {steps.map((s, i) => (
            <span
              key={s}
              className={`flex-1 rounded-full transition-colors ${i <= index ? "bg-accent-strong" : ""}`}
            />
          ))}
        </div>
      </div>

      <header className="flex flex-col gap-2">
        <h1 className="type-page">{title}</h1>
        <p className="text-muted max-w-prose">{lead}</p>
      </header>

      {step === "foyer" ? (
        <div className="flex flex-col gap-6">
          <Field
            label="Ton prénom ou pseudo"
            name="displayName"
            autoComplete="given-name"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            hint="Visible par les membres de ton foyer."
          />
          {props.isOwner ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold" id="people-label">
                Combien êtes-vous à table ?
              </span>
              <div className="flex items-center gap-4" role="group" aria-labelledby="people-label">
                <button
                  type="button"
                  onClick={() => setPeople((n) => Math.max(1, n - 1))}
                  disabled={people <= 1}
                  aria-label="Une personne de moins"
                  className="border-border-strong hover:border-forest flex size-12 items-center justify-center rounded-full border disabled:opacity-40"
                >
                  <MinusIcon size={20} />
                </button>
                <span
                  className="font-display min-w-24 text-center text-3xl font-semibold tabular-nums"
                  aria-live="polite"
                >
                  {people}
                  <span className="text-muted block font-sans text-sm font-normal">
                    personne{people > 1 ? "s" : ""}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setPeople((n) => Math.min(20, n + 1))}
                  disabled={people >= 20}
                  aria-label="Une personne de plus"
                  className="border-border-strong hover:border-forest flex size-12 items-center justify-center rounded-full border disabled:opacity-40"
                >
                  <PlusIcon size={20} />
                </button>
              </div>
              <p className="text-muted text-xs">
                Les portions des recettes sont calculées pour ce nombre.
              </p>
            </div>
          ) : (
            <Alert tone="info">
              Tu as rejoint le foyer « {props.householdName} ». Sa taille, sa semaine de repas et
              son budget sont réglés par son propriétaire. Les préférences alimentaires, elles, sont
              partagées par tout le foyer.
            </Alert>
          )}
        </div>
      ) : null}

      {step === "semaine" ? (
        <div className="flex flex-col gap-8">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">Je prévois…</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {PRESETS.map((p) => (
                <label key={p.id} className={card}>
                  <input
                    type="radio"
                    name="preset"
                    checked={preset === p.id}
                    onChange={() => setSlots(new Set(PATTERN_PRESETS[p.id]))}
                    className="accent-forest mt-1 size-4"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{p.label}</span>
                    <span className="text-muted text-sm">{p.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {preset === null ? (
              <p className="text-muted text-sm">
                Ta semaine sur mesure ({slots.size} repas) est conservée. Tu peux la régler jour par
                jour dans les paramètres.
              </p>
            ) : (
              <p className="text-muted text-sm">
                Besoin d&apos;un réglage jour par jour (cantine le mardi…) ? Il se fait ensuite dans
                les paramètres.
              </p>
            )}
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">Un plat cuisiné couvre…</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {PER_COOK.map((o) => (
                <label key={o.n} className={card}>
                  <input
                    type="radio"
                    name="perCook"
                    checked={perCook === o.n}
                    onChange={() => setPerCook(o.n)}
                    className="accent-forest mt-1 size-4"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{o.label}</span>
                    <span className="text-muted text-sm">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-sm" aria-live="polite">
              <strong className="tabular-nums">{slots.size}</strong> repas par semaine
              {perCook > 1 ? (
                <>
                  , soit <strong className="tabular-nums">{Math.ceil(slots.size / perCook)}</strong>{" "}
                  fois en cuisine
                </>
              ) : null}
              .
            </p>
          </fieldset>
        </div>
      ) : null}

      {step === "regime" ? (
        <div className="flex flex-col gap-8">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-semibold">Régime</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {EATING_STYLES.map((s) => (
                <label key={s.code} className={card}>
                  <input
                    type="radio"
                    name="style"
                    checked={style === s.code}
                    onChange={() => setStyle(s.code)}
                    className="accent-forest mt-1 size-4"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-muted text-sm">{s.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <label className={`${chip} self-start`}>
              <input
                type="checkbox"
                checked={noPork}
                onChange={(e) => setNoPork(e.target.checked)}
                className="sr-only"
              />
              Sans porc
            </label>
          </fieldset>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-semibold">Allergies</legend>
            <p className="text-muted -mt-1 text-sm">
              Toute recette contenant l&apos;un de ces allergènes est exclue. Rien à signaler ?
              Passe à la suite.
            </p>
            <div className="flex flex-wrap gap-2">
              {props.allergenOptions.map((a) => (
                <label key={a.code} className={chip}>
                  <input
                    type="checkbox"
                    checked={allergens.has(a.code)}
                    onChange={() => setAllergens((s) => toggled(s, a.code))}
                    className="sr-only"
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      {step === "envies" ? (
        <div className="flex flex-col gap-8">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-semibold">Mes objectifs</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {OBJECTIVES.map((o) => (
                <label
                  key={o.code}
                  className="border-border bg-surface has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-accent flex cursor-pointer items-start gap-3 rounded-2xl border p-4 has-focus-visible:outline-2"
                >
                  <input
                    type="checkbox"
                    checked={objectives.has(o.code)}
                    onChange={() => setObjectives((s) => toggled(s, o.code))}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="border-border-strong peer-checked:border-accent-strong peer-checked:bg-accent-strong mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 text-white"
                  >
                    <CheckIcon size={14} strokeWidth={3} />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{o.label}</span>
                    <span className="text-muted text-sm">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-semibold">Mon matériel</legend>
            <p className="text-muted -mt-1 text-sm">Décoche ce que tu n&apos;as pas.</p>
            <div className="flex flex-wrap gap-2">
              {props.equipmentOptions.map((e) => (
                <label key={e.code} className={chip}>
                  <input
                    type="checkbox"
                    checked={equipment.has(e.code)}
                    onChange={() => setEquipment((s) => toggled(s, e.code))}
                    className="sr-only"
                  />
                  {e.label}
                </label>
              ))}
            </div>
          </fieldset>
          {props.isOwner ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Budget courses par semaine (€)"
                name="weeklyBudget"
                inputMode="decimal"
                placeholder="Facultatif"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                error={fieldErrors.budget}
              />
              <Field
                label="Temps de préparation maximum (min)"
                name="maxPrepMinutes"
                inputMode="numeric"
                placeholder="Facultatif"
                value={prep}
                onChange={(e) => setPrep(e.target.value)}
                hint="Temps de travail en cuisine, hors cuisson et attente."
                error={fieldErrors.prep}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="border-border flex items-center justify-between gap-3 border-t pt-6">
        {index > 0 ? (
          <Button variant="ghost" onClick={() => goTo(index - 1)} disabled={pending}>
            <ChevronLeftIcon size={18} />
            Retour
          </Button>
        ) : (
          <span />
        )}
        {last ? (
          <Button onClick={submit} disabled={pending}>
            {pending ? "Enregistrement…" : props.replay ? "Enregistrer" : "Terminer"}
            <CheckIcon size={18} />
          </Button>
        ) : (
          <Button onClick={() => goTo(index + 1)} disabled={step === "semaine" && slots.size === 0}>
            Continuer
            <ArrowRightIcon size={18} />
          </Button>
        )}
      </div>
    </div>
  );
}

function Done({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <LogoMark size={88} />
      <div className="flex flex-col gap-2">
        <h1 className="type-page">{name ? `C'est prêt, ${name} !` : "C'est prêt !"}</h1>
        <p className="text-muted max-w-md">
          Tes menus tiendront compte de tes réponses. Tu peux les modifier à tout moment dans les
          paramètres.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/planner" className={buttonClasses("primary")}>
          Composer mon premier menu
          <ArrowRightIcon size={18} />
        </Link>
        <Link href="/dashboard" className={buttonClasses("secondary")}>
          Aller à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
