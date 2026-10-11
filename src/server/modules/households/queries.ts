import "server-only";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { getCurrentContext } from "@/server/modules/auth/session";

/** Paramètres du foyer actif, vocabulaire de référence et droits de l'utilisateur. */
export async function getHouseholdSettings() {
  const { user, household } = await getCurrentContext();
  if (!household) return null;

  const supabase = await createSupabaseServerClient();
  const [membership, diets, allergens, chosenDiets, chosenAllergens, avoided, ingredients] =
    await Promise.all([
      supabase
        .from("household_members")
        .select("role")
        .eq("household_id", household.id)
        .eq("user_id", user.id)
        .single(),
      supabase.from("diets").select("code, label").order("label"),
      supabase.from("allergens").select("code, label").order("label"),
      supabase.from("household_diets").select("diet_code").eq("household_id", household.id),
      supabase
        .from("household_exclusions")
        .select("allergen_code")
        .eq("household_id", household.id)
        .not("allergen_code", "is", null),
      supabase
        .from("household_exclusions")
        .select("ingredient_id, ingredients (name)")
        .eq("household_id", household.id)
        .not("ingredient_id", "is", null),
      supabase.from("ingredients").select("name").order("name"),
    ]);

  for (const result of [
    membership,
    diets,
    allergens,
    chosenDiets,
    chosenAllergens,
    avoided,
    ingredients,
  ]) {
    if (result.error)
      throw new Error(`Lecture des paramètres impossible : ${result.error.message}`);
  }

  const full = await supabase
    .from("households")
    .select("id, name, people_count, weekly_budget_cents, currency, timezone, max_prep_minutes")
    .eq("id", household.id)
    .single();
  if (full.error) throw new Error(`Lecture du foyer impossible : ${full.error.message}`);

  return {
    household: full.data,
    isOwner: membership.data?.role === "owner",
    diets: diets.data ?? [],
    allergens: allergens.data ?? [],
    selectedDiets: (chosenDiets.data ?? []).map((d) => d.diet_code),
    selectedAllergens: (chosenAllergens.data ?? [])
      .map((a) => a.allergen_code)
      .filter((code): code is string => code !== null),
    avoidedFoods: (avoided.data ?? [])
      .flatMap((a) =>
        a.ingredient_id ? [{ id: a.ingredient_id, name: a.ingredients?.name ?? "?" }] : [],
      )
      .sort((a, b) => a.name.localeCompare(b.name, "fr")),
  };
}
