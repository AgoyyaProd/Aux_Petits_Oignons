"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { generatePlan, type PlanEntry } from "@/domain/planning";
import { ActionError } from "@/server/errors";
import { getCurrentContext } from "@/server/modules/auth/session";
import { firstErrors } from "@/server/modules/households/schema";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { loadPlanningCatalog } from "./catalog";
import { readPlan, savePlan, type StoredPlan } from "./repository";
import {
  entrySchema,
  generateSchema,
  planActionSchema,
  replaceSchema,
  servingsSchema,
  type GenerateField,
  type PlannerState,
} from "./schema";

function failure(error: unknown): PlannerState {
  if (error instanceof ActionError) {
    if (error.kind === "conflict") refresh();
    return { status: "error", message: error.message };
  }
  console.error("Action menu en échec", error);
  return { status: "error", message: "Une erreur est survenue. Réessaie dans un instant." };
}

async function context() {
  const { household } = await getCurrentContext();
  if (!household) throw new ActionError("forbidden", "Aucun foyer actif.");
  const supabase = await createSupabaseServerClient();
  return { household, supabase };
}

async function catalogFor(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  household: { id: string; timezone: string },
) {
  const settings = await supabase
    .from("households")
    .select("max_prep_minutes")
    .eq("id", household.id)
    .single();
  if (settings.error) throw new Error(settings.error.message);
  return loadPlanningCatalog(supabase, {
    ...household,
    maxPrepMinutes: settings.data.max_prep_minutes,
  });
}

/** Le menu doit exister et être à la version vue par l'utilisateur. */
function requirePlan(plan: StoredPlan | null, version: number | null): StoredPlan {
  if (!plan) throw new ActionError("not_found", "Ce menu n'existe plus. Recharge la page.");
  if (version !== null && plan.version !== version) {
    throw new ActionError("conflict", "Le menu a été modifié entre-temps. Recharge la page.");
  }
  return plan;
}

/** Proposer un menu (nouveau) ou le relancer en gardant les plats verrouillés. */
export async function generatePlanAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const parsed = generateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstErrors<GenerateField>(parsed.error) };
  }
  const input = parsed.data;
  try {
    const { household, supabase } = await context();
    const [plan, catalog] = await Promise.all([
      readPlan(supabase, household.id, input.week),
      catalogFor(supabase, household),
    ]);
    if (plan && input.version === null) {
      throw new ActionError(
        "conflict",
        "Un menu existe déjà pour cette semaine. Recharge la page.",
      );
    }
    if (plan) requirePlan(plan, input.version);
    // On ne garde que les plats verrouillés encore proposables (allergies changées entre-temps).
    const allowed = new Set(catalog.candidates.map((c) => c.id));
    const locked = (plan?.entries ?? []).filter((e) => e.locked && allowed.has(e.recipeId));
    if (locked.length > input.mealCount) {
      return {
        status: "error",
        fieldErrors: {
          mealCount: `Tu as ${locked.length} plats gardés : demande au moins autant de repas.`,
        },
      };
    }
    const seed = plan ? plan.seed + 1 : 0;
    const result = generatePlan(catalog.candidates, {
      mealCount: input.mealCount,
      people: input.people,
      budgetCents: input.budget,
      locked: locked.map((e) => ({ recipeId: e.recipeId, servings: e.servings })),
      seed,
    });
    if (result.entries.length === 0) {
      return {
        status: "error",
        message: "Aucune recette ne correspond à tes préférences. Assouplis-les dans Paramètres.",
      };
    }
    await savePlan(supabase, {
      householdId: household.id,
      weekStart: input.week,
      people: input.people,
      mealCount: input.mealCount,
      budgetCents: input.budget,
      seed,
      entries: result.entries,
      expectedVersion: plan?.version ?? null,
      idempotencyKey: input.key,
    });
    refresh();
    const notes = {
      ok: "Menu proposé.",
      over_budget:
        "Menu proposé : c'est le moins cher possible avec tes préférences, mais il dépasse le budget.",
      not_enough_recipes: `Seulement ${result.entries.length} recette(s) compatible(s) pour ${input.mealCount} repas.`,
    } as const;
    return { status: result.status === "ok" ? "success" : "error", message: notes[result.status] };
  } catch (error) {
    return failure(error);
  }
}

type EntryEdit = (entries: PlanEntry[], plan: StoredPlan) => PlanEntry[] | Promise<PlanEntry[]>;

/** Modifie les plats d'un menu existant puis l'enregistre entièrement. */
async function editEntries(
  input: { week: string; version: number | null; key: string },
  edit: EntryEdit,
): Promise<PlannerState> {
  try {
    const { household, supabase } = await context();
    const plan = requirePlan(await readPlan(supabase, household.id, input.week), input.version);
    const entries = await edit(
      plan.entries.map((e) => ({ ...e })),
      plan,
    );
    await savePlan(supabase, {
      householdId: household.id,
      weekStart: input.week,
      people: plan.people,
      mealCount: Math.max(1, entries.length),
      budgetCents: plan.budgetCents,
      seed: plan.seed,
      entries,
      expectedVersion: plan.version,
      idempotencyKey: input.key,
    });
    refresh();
    return { status: "success" };
  } catch (error) {
    return failure(error);
  }
}

function entryAt(entries: PlanEntry[], position: number): PlanEntry {
  const entry = entries[position - 1];
  if (!entry)
    throw new ActionError("not_found", "Ce plat n'est plus dans le menu. Recharge la page.");
  return entry;
}

export async function toggleLockAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const parsed = entrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Requête invalide." };
  return editEntries(parsed.data, (entries) => {
    const entry = entryAt(entries, parsed.data.position);
    entry.locked = !entry.locked;
    return entries;
  });
}

export async function removeEntryAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const parsed = entrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Requête invalide." };
  return editEntries(parsed.data, (entries) => {
    entryAt(entries, parsed.data.position);
    return entries.filter((_, i) => i !== parsed.data.position - 1);
  });
}

export async function setServingsAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const parsed = servingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Entre 1 et 40 portions." };
  return editEntries(parsed.data, (entries) => {
    entryAt(entries, parsed.data.position).servings = parsed.data.servings;
    return entries;
  });
}

/** Ajoute un plat proposé par le générateur, en gardant tous les plats actuels. */
export async function addEntryAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const parsed = planActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Requête invalide." };
  if (parsed.data.version === null) return { status: "error", message: "Requête invalide." };
  let added = true;
  const state = await editEntries(parsed.data, async (entries, plan) => {
    if (entries.length >= 21) throw new ActionError("invalid", "Au plus 21 plats par semaine.");
    const { household, supabase } = await context();
    const catalog = await catalogFor(supabase, household);
    const result = generatePlan(catalog.candidates, {
      mealCount: entries.length + 1,
      people: plan.people,
      budgetCents: plan.budgetCents,
      locked: entries.map((e) => ({ recipeId: e.recipeId, servings: e.servings })),
      seed: plan.seed + entries.length,
    });
    const extra = result.entries[entries.length];
    if (!extra) {
      added = false;
      return entries;
    }
    return [...entries, { ...extra, locked: false }];
  });
  if (state.status === "success" && !added) {
    return { status: "error", message: "Plus aucune recette compatible à proposer." };
  }
  return state;
}

/** Remplace un plat par une recette proposée (contrôlée côté serveur et en base). */
export async function replaceEntryAction(formData: FormData): Promise<void> {
  const parsed = replaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/planner");
  const { week, recipeId, position } = parsed.data;
  const state = await editEntries(parsed.data, async (entries, plan) => {
    const { household, supabase } = await context();
    const catalog = await catalogFor(supabase, household);
    if (!catalog.candidates.some((c) => c.id === recipeId)) {
      throw new ActionError("invalid", "Cette recette ne correspond pas à tes préférences.");
    }
    if (entries.some((e, i) => e.recipeId === recipeId && i !== position - 1)) {
      throw new ActionError("invalid", "Cette recette est déjà dans le menu.");
    }
    const entry = entryAt(entries, position);
    entries[position - 1] = { recipeId, servings: entry.servings || plan.people, locked: false };
    return entries;
  });
  redirect(
    state.status === "success"
      ? `/planner?semaine=${week}`
      : `/planner?semaine=${week}&remplacer=${position}&erreur=1`,
  );
}
