"use server";

import { refresh } from "next/cache";
import { monthOf } from "@/domain/recipes/season";
import { redirect } from "next/navigation";
import {
  addLeftover,
  autoPlace,
  batchGroups,
  generatePlan,
  normalizeLeftovers,
  parseSlotKey,
  placeBatches,
  toPattern,
  type MealPattern,
  removeEntryWithLeftovers,
  slotKey,
  type PlanEntry,
} from "@/domain/planning";
import { todayIn } from "@/lib/dates";
import { mondayOf } from "@/lib/week";
import { randomUUID } from "node:crypto";
import { ActionError } from "@/server/errors";
import { getCurrentContext } from "@/server/modules/auth/session";
import { firstErrors } from "@/server/modules/households/schema";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { recentRecipeIds } from "@/server/modules/recipes/ratings";
import { loadPlanningCatalog } from "./catalog";
import { readPlan, savePlan, type StoredPlan } from "./repository";
import {
  entrySchema,
  generateSchema,
  planActionSchema,
  replaceSchema,
  servingsSchema,
  slotSchema,
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

type Db = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Réglages du foyer utiles au menu : durée maximale et semaine type. */
async function planningSettings(db: Db, householdId: string) {
  const settings = await db
    .from("households")
    .select("max_prep_minutes, meal_slots, meals_per_cook")
    .eq("id", householdId)
    .single();
  if (settings.error) throw new Error(settings.error.message);
  return {
    maxPrepMinutes: settings.data.max_prep_minutes,
    pattern: toPattern(settings.data.meal_slots, settings.data.meals_per_cook),
  };
}

async function catalogFor(supabase: Db, household: { id: string; timezone: string }) {
  const settings = await planningSettings(supabase, household.id);
  const catalog = await loadPlanningCatalog(supabase, {
    ...household,
    maxPrepMinutes: settings.maxPrepMinutes,
  });
  return { ...catalog, pattern: settings.pattern };
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
    const [plan, catalog, recent] = await Promise.all([
      readPlan(supabase, household.id, input.week),
      catalogFor(supabase, household),
      recentRecipeIds(supabase, household.id, input.week),
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
    // Plats cuisinés : toujours gardés (le stock a déjà été décompté). Les restes d'un plat
    // gardé le suivent.
    const keptSources = (plan?.entries ?? []).filter(
      (e, i) => !e.leftover && (plan!.cooked.has(i + 1) || (e.locked && allowed.has(e.recipeId))),
    );
    const keptIds = new Set(keptSources.map((e) => e.recipeId));
    const kept0 = (plan?.entries ?? []).filter(
      (e, i) =>
        plan!.cooked.has(i + 1) || (e.leftover ? keptIds.has(e.recipeId) : keptSources.includes(e)),
    );
    // Les restes gardés occupent un repas mais ne passent pas par le générateur (déjà payés).
    const leftovers = kept0.filter((e) => e.leftover);
    const locked = kept0.filter((e) => !e.leftover);
    if (kept0.length > input.mealCount) {
      return {
        status: "error",
        fieldErrors: {
          mealCount: `Tu as ${kept0.length} plats gardés : demande au moins autant de repas.`,
        },
      };
    }
    const seed = plan ? plan.seed + 1 : 0;
    const pattern = catalog.pattern;
    const today = todayIn(household.timezone);
    // Les plats gardés conservent leur jour (et leurs portions) ; les repas restants sont
    // découpés en lots : un nouveau plat par lot, ses restes aux repas suivants du lot.
    const keptPlaced = autoPlace([...locked, ...leftovers], input.week, today, pattern);
    const groups = batchGroups(
      keptPlaced,
      input.mealCount - kept0.length,
      input.week,
      today,
      pattern,
    );
    const result = generatePlan(catalog.candidates, {
      mealCount: locked.length + groups.length,
      people: input.people * pattern.mealsPerCook,
      budgetCents: input.budget,
      locked: locked.map((e) => ({ recipeId: e.recipeId, servings: e.servings })),
      recentRecipeIds: recent,
      profile: catalog.profile,
      month: monthOf(input.week),
      seed,
    });
    const fresh = result.entries.slice(locked.length).map((e) => e.recipeId);
    const entries = normalizeLeftovers(
      placeBatches(keptPlaced, fresh, groups, input.people),
      input.week,
      pattern,
    );
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
      entries,
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

type EntryEdit = (
  entries: PlanEntry[],
  plan: StoredPlan,
  pattern: MealPattern,
) => PlanEntry[] | Promise<PlanEntry[]>;

/** Modifie les plats d'un menu existant puis l'enregistre entièrement. */
async function editEntries(
  input: { week: string; version: number | null; key: string },
  edit: EntryEdit,
): Promise<PlannerState> {
  try {
    const { household, supabase } = await context();
    const [stored, settings] = await Promise.all([
      readPlan(supabase, household.id, input.week),
      planningSettings(supabase, household.id),
    ]);
    const plan = requirePlan(stored, input.version);
    const entries = normalizeLeftovers(
      await edit(
        plan.entries.map((e) => ({ ...e })),
        plan,
        settings.pattern,
      ),
      input.week,
      settings.pattern,
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

/** Un plat cuisiné ne se modifie plus : ses ingrédients ont déjà quitté le garde-manger. */
function assertNotCooked(plan: StoredPlan, position: number): void {
  if (plan.cooked.has(position)) {
    throw new ActionError("invalid", "Ce plat est déjà cuisiné : il ne peut plus être modifié.");
  }
}

/** Les portions d'un reste suivent son plat cuisiné : on ne les modifie pas à part. */
function assertNotLeftover(entries: PlanEntry[], position: number): void {
  if (entryAt(entries, position).leftover) {
    throw new ActionError("invalid", "C'est un reste : modifie plutôt le plat cuisiné.");
  }
}

/**
 * « Cuisiner double » : le plat reçoit les portions d'un repas de plus, et un reste est placé
 * au repas libre suivant. Les courses comptent le double ; le reste ne coûte rien de plus.
 */
export async function cookDoubleAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const parsed = entrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Requête invalide." };
  const { week, position } = parsed.data;
  return editEntries(parsed.data, (entries, plan, pattern) => {
    const entry = entryAt(entries, position);
    assertNotCooked(plan, position);
    if (entry.leftover) throw new ActionError("invalid", "C'est déjà un reste.");
    if (entries.length >= 21) throw new ActionError("invalid", "Au plus 21 plats par semaine.");
    if (entry.servings + plan.people > 40) {
      throw new ActionError("invalid", "Trop de portions pour un seul plat (40 au plus).");
    }
    return addLeftover(entries, position - 1, plan.people, week, pattern);
  });
}

export async function toggleLockAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const parsed = entrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Requête invalide." };
  return editEntries(parsed.data, (entries) => {
    const entry = entryAt(entries, parsed.data.position);
    if (entry.leftover) {
      throw new ActionError(
        "invalid",
        "Un reste est toujours gardé ; retire-le s'il ne sert plus.",
      );
    }
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
  return editEntries(parsed.data, (entries, plan) => {
    entryAt(entries, parsed.data.position);
    assertNotCooked(plan, parsed.data.position);
    return removeEntryWithLeftovers(entries, parsed.data.position - 1);
  });
}

export async function setServingsAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const parsed = servingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Entre 1 et 40 portions." };
  return editEntries(parsed.data, (entries, plan) => {
    assertNotCooked(plan, parsed.data.position);
    assertNotLeftover(entries, parsed.data.position);
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
  const input = parsed.data;
  const slotParam = String(formData.get("slot") ?? "");
  const state = await editEntries(parsed.data, async (entries, plan, pattern) => {
    if (entries.length >= 21) throw new ActionError("invalid", "Au plus 21 plats par semaine.");
    const { household, supabase } = await context();
    const [catalog, recent] = await Promise.all([
      catalogFor(supabase, household),
      recentRecipeIds(supabase, household.id, input.week),
    ]);
    const cooking = entries.filter((e) => !e.leftover);
    const result = generatePlan(catalog.candidates, {
      recentRecipeIds: recent,
      profile: catalog.profile,
      month: monthOf(input.week),
      mealCount: cooking.length + 1,
      people: plan.people,
      budgetCents: plan.budgetCents,
      locked: cooking.map((e) => ({ recipeId: e.recipeId, servings: e.servings })),
      seed: plan.seed + entries.length,
    });
    const extra = result.entries[cooking.length];
    if (!extra) {
      added = false;
      return entries;
    }
    // Case demandée (bouton « + » d'une case vide) si elle est libre ; sinon première case
    // libre. On ne déplace pas les plats que le foyer a laissés sans jour.
    const wanted = slotParam ? parseSlotKey(slotParam, input.week) : null;
    const free = wanted && !entries.some((e) => e.day === wanted.day && e.slot === wanted.slot);
    const placed = free
      ? { ...extra, locked: false, day: wanted.day, slot: wanted.slot }
      : autoPlace(
          [...entries, { ...extra, locked: false }],
          input.week,
          todayIn(household.timezone),
          pattern,
        ).at(-1)!;
    return [...entries, placed];
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
    assertNotCooked(plan, position);
    assertNotLeftover(entries, position);
    entries[position - 1] = {
      recipeId,
      servings: entry.servings || plan.people,
      locked: false,
      day: entry.day,
      slot: entry.slot,
    };
    return entries;
  });
  redirect(
    state.status === "success"
      ? `/planner?semaine=${week}`
      : `/planner?semaine=${week}&remplacer=${position}&erreur=1`,
  );
}

/**
 * Place un plat un jour donné (midi ou soir), ou le retire du planning.
 * Si la case est déjà prise, les deux plats échangent leur place.
 */
export async function setSlotAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const parsed = slotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Jour invalide." };
  const { week, position, slot } = parsed.data;
  const target = slot ? parseSlotKey(slot, week) : null;
  if (slot && !target) return { status: "error", message: "Ce jour n'est pas dans la semaine." };
  return editEntries(parsed.data, (entries, plan) => {
    const entry = entryAt(entries, position);
    assertNotCooked(plan, position);
    const previous = { day: entry.day ?? null, slot: entry.slot ?? null };
    if (target) {
      const other = entries.findIndex(
        (e, i) =>
          i !== position - 1 && e.day && e.slot && slotKey({ day: e.day, slot: e.slot }) === slot,
      );
      if (other >= 0) {
        if (plan.cooked.has(other + 1)) {
          throw new ActionError("invalid", "Ce repas est déjà cuisiné : choisis un autre jour.");
        }
        entries[other]!.day = previous.day;
        entries[other]!.slot = previous.slot;
      }
    }
    entry.day = target?.day ?? null;
    entry.slot = target?.slot ?? null;
    return entries;
  });
}

/**
 * Ajoute une recette au menu de la semaine en cours, sur la première case libre.
 * Crée le menu s'il n'existe pas encore (budget et nombre de personnes du foyer).
 */
export async function addRecipeToPlanAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const recipeId = String(formData.get("recipeId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(recipeId)) return { status: "error", message: "Recette invalide." };
  try {
    const { household, supabase } = await context();
    const today = todayIn(household.timezone);
    const week = mondayOf(today);
    const [plan, catalog] = await Promise.all([
      readPlan(supabase, household.id, week),
      catalogFor(supabase, household),
    ]);
    const meta = catalog.recipes.get(recipeId);
    if (!meta) throw new ActionError("not_found", "Recette introuvable.");
    if (!meta.compatible) {
      throw new ActionError("invalid", "Cette recette ne correspond pas aux préférences du foyer.");
    }
    const entries = plan?.entries.map((e) => ({ ...e })) ?? [];
    if (entries.some((e) => e.recipeId === recipeId)) {
      return { status: "success", message: "Déjà au menu de la semaine." };
    }
    if (entries.length >= 21) throw new ActionError("invalid", "Au plus 21 plats par semaine.");
    const people = plan?.people ?? household.people_count;
    const placed = autoPlace(
      [...entries, { recipeId, servings: people, locked: false }],
      week,
      today,
      catalog.pattern,
    ).at(-1)!;
    await savePlan(supabase, {
      householdId: household.id,
      weekStart: week,
      people,
      mealCount: entries.length + 1,
      budgetCents: plan ? plan.budgetCents : household.weekly_budget_cents,
      seed: plan?.seed ?? 0,
      entries: [...entries, placed],
      expectedVersion: plan?.version ?? null,
      idempotencyKey: randomUUID(),
    });
    refresh();
    return {
      status: "success",
      message: placed.day ? "Ajouté au menu de la semaine." : "Ajouté au menu (pas encore placé).",
    };
  } catch (error) {
    return failure(error);
  }
}

/**
 * « Réorganiser ma semaine » : replace tous les plats pas encore cuisinés sur les prochains
 * repas libres (soirs d'abord, à partir d'aujourd'hui). Les plats cuisinés ne bougent pas.
 */
export async function reorganizeAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const parsed = planActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.version === null) {
    return { status: "error", message: "Requête invalide." };
  }
  const { household } = await getCurrentContext();
  const today = household ? todayIn(household.timezone) : parsed.data.week;
  return editEntries(parsed.data, (entries, plan, pattern) =>
    autoPlace(
      entries.map((e, i) => (plan.cooked.has(i + 1) ? e : { ...e, day: null, slot: null })),
      parsed.data.week,
      today,
      pattern,
    ),
  );
}
