import "server-only";
import { getCurrentContext } from "@/server/modules/auth/session";
import { getPlanningCatalog } from "@/server/modules/planning/catalog";
import { loadPriceBook } from "@/server/modules/prices/price-book";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Fiche d'un ingrédient (sans vente) : prix indicatif s'il existe, ce que le foyer en a,
 * et les recettes qui l'utilisent. La saison n'est pas affichée : aucune donnée fiable.
 */
export async function getIngredientPage(id: string) {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();

  const { data: ingredient, error } = await supabase
    .from("ingredients")
    .select("id, name, category, parent_id, is_staple")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Lecture de l'ingrédient impossible : ${error.message}`);
  if (!ingredient) return null;

  const settings = await supabase
    .from("households")
    .select("max_prep_minutes")
    .eq("id", household.id)
    .single();
  if (settings.error) throw new Error(settings.error.message);

  const [stock, priceBook, catalog, uses] = await Promise.all([
    supabase
      .from("pantry_items")
      .select(
        "id, location, quantity_base, dimension, display_unit, expires_on, expiry_kind, opened_at",
      )
      .eq("household_id", household.id)
      .eq("ingredient_id", id)
      .eq("status", "active"),
    loadPriceBook(supabase, household.id),
    getPlanningCatalog(household.id, household.timezone, settings.data.max_prep_minutes),
    supabase.from("recipe_ingredients").select("recipe_id").eq("ingredient_id", id),
  ]);
  if (stock.error) throw new Error(stock.error.message);
  if (uses.error) throw new Error(uses.error.message);

  const recipes = [...new Set(uses.data.map((u) => u.recipe_id))]
    .map((rid) => catalog.recipes.get(rid))
    .filter((r): r is NonNullable<typeof r> => Boolean(r && r.compatible))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.title.localeCompare(b.title, "fr"))
    .slice(0, 8);

  return {
    ingredient,
    price: priceBook.get(id) ?? null,
    stock: stock.data,
    recipes,
  };
}
