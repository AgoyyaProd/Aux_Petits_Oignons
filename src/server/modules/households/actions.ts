"use server";

import { refresh } from "next/cache";
import { toActionError } from "@/server/errors";
import { requireUser } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  firstErrors,
  householdSettingsSchema,
  preferencesSchema,
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
