"use server";

import { refresh } from "next/cache";
import { toActionError } from "@/server/errors";
import { requireUser } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { resolveIngredient } from "@/server/modules/pantry/repository";
import { AISLES } from "@/lib/categories";
import {
  avoidedFoodSchema,
  foodProfileSchema,
  firstErrors,
  householdSettingsSchema,
  preferencesSchema,
  removeAvoidedFoodSchema,
  type FormState,
  type SettingsFieldName,
} from "./schema";

export async function saveHouseholdSettingsAction(
  _prev: FormState<SettingsFieldName>,
  formData: FormData,
): Promise<FormState<SettingsFieldName>> {
  await requireUser();
  const parsed = householdSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstErrors<SettingsFieldName>(parsed.error) };
  }
  const { householdId, name, peopleCount, weeklyBudget, maxPrepMinutes } = parsed.data;

  const supabase = await createSupabaseServerClient();
  // La RLS limite la mise à jour au propriétaire : 0 ligne = pas le droit.
  const { data, error } = await supabase
    .from("households")
    .update({
      name,
      people_count: peopleCount,
      weekly_budget_cents: weeklyBudget,
      max_prep_minutes: maxPrepMinutes,
    })
    .eq("id", householdId)
    .select("id");

  if (error) return { status: "error", message: toActionError(error).message };
  if (!data?.length) {
    return {
      status: "error",
      message: "Seul le propriétaire du foyer peut modifier ces réglages.",
    };
  }
  refresh();
  return { status: "success", message: "Foyer enregistré." };
}

export async function savePreferencesAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = preferencesSchema.safeParse({
    householdId: formData.get("householdId"),
    diets: formData.getAll("diets"),
    allergens: formData.getAll("allergens"),
  });
  if (!parsed.success) return { status: "error", message: "Sélection invalide." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_household_preferences", {
    p_household_id: parsed.data.householdId,
    p_diets: parsed.data.diets,
    p_allergens: parsed.data.allergens,
  });
  if (error) return { status: "error", message: toActionError(error).message };

  refresh();
  return { status: "success", message: "Préférences enregistrées." };
}

const UNIQUE_VIOLATION = "23505";

/**
 * Ajoute un aliment que le foyer ne veut pas manger. Idempotent : l'ajouter
 * une seconde fois (double clic, nouvel essai réseau) ne change rien.
 */
export async function addAvoidedFoodAction(
  _prev: FormState<"ingredient">,
  formData: FormData,
): Promise<FormState<"ingredient">> {
  await requireUser();
  const parsed = avoidedFoodSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstErrors<"ingredient">(parsed.error) };
  }
  const { householdId, ingredient } = parsed.data;

  const supabase = await createSupabaseServerClient();
  let ingredientId: string | null;
  try {
    ingredientId = await resolveIngredient(supabase, ingredient);
  } catch {
    return { status: "error", message: "Recherche de l'aliment impossible. Réessaie." };
  }
  if (!ingredientId) {
    return {
      status: "error",
      fieldErrors: { ingredient: "Aliment inconnu : choisis-le dans la liste proposée." },
    };
  }

  const { error } = await supabase
    .from("household_exclusions")
    .insert({ household_id: householdId, ingredient_id: ingredientId, is_allergy: false });
  if (error && error.code !== UNIQUE_VIOLATION) {
    return { status: "error", message: toActionError(error).message };
  }

  refresh();
  return { status: "success", message: `« ${ingredient} » ajouté.` };
}

/** Retire un aliment de la liste. Idempotent : retirer un absent ne fait rien. */
export async function removeAvoidedFoodAction(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = removeAvoidedFoodSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("household_exclusions")
    .delete()
    .eq("household_id", parsed.data.householdId)
    .eq("ingredient_id", parsed.data.ingredientId);
  if (error) throw new Error(toActionError(error).message);
  refresh();
}

/** Régime, objectifs, allergies et matériel, enregistrés ensemble (set_food_profile). */
export async function saveFoodProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = foodProfileSchema.safeParse({
    householdId: formData.get("householdId"),
    style: formData.get("style"),
    noPork: formData.get("noPork") === "on",
    allergens: formData.getAll("allergens"),
    objectives: formData.getAll("objectives"),
    equipment: formData.getAll("equipment"),
  });
  if (!parsed.success) return { status: "error", message: "Sélection invalide." };
  const d = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_food_profile", {
    p_household_id: d.householdId,
    p_eating_style: d.style,
    p_no_pork: d.noPork,
    p_allergens: d.allergens,
    p_objectives: d.objectives,
    p_equipment: d.equipment,
  });
  if (error) return { status: "error", message: toActionError(error).message };
  refresh();
  return {
    status: "success",
    message: "Préférences enregistrées : les prochains menus en tiennent compte.",
  };
}

/** Ordre des rayons du magasin du foyer (propriétaire seulement, contrôlé par la RLS). */
export async function saveAisleOrderAction(
  householdId: string,
  order: string[] | null,
): Promise<{ ok: boolean; message: string }> {
  await requireUser();
  const valid = new Set(AISLES.map((a) => a.category));
  if (
    !/^[0-9a-f-]{36}$/.test(householdId) ||
    (order !== null && (order.length !== new Set(order).size || order.some((c) => !valid.has(c))))
  ) {
    return { ok: false, message: "Ordre des rayons invalide." };
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("households")
    .update({ aisle_order: order })
    .eq("id", householdId)
    .select("id");
  if (error) return { ok: false, message: toActionError(error).message };
  if (!data?.length) {
    return { ok: false, message: "Seul le propriétaire du foyer peut modifier ce réglage." };
  }
  refresh();
  return {
    ok: true,
    message: order ? "Ordre des rayons enregistré." : "Ordre par défaut rétabli.",
  };
}
