import "server-only";
import type { IngredientChoice } from "@/lib/ingredient-search";
import { comparePantryItems, isPriority } from "@/domain/pantry/priority";
import { todayIn } from "@/lib/dates";
import { getCurrentContext } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { Location } from "./schema";

export interface PantryItemView {
  id: string;
  /** Lien vers la fiche ingrédient. */
  ingredientId: string;
  /** Slug de l'ingrédient, pour sa photo (lib/images). */
  ingredientSlug: string | null;
  ingredientName: string;
  category: string;
  location: Location;
  quantityBase: string | null;
  dimension: "mass" | "volume" | "count";
  displayUnit: string;
  expiresOn: string | null;
  expiryKind: "use_by" | "best_before" | null;
  openedAt: string | null;
  version: number;
  priority: boolean;
}

/** Stock actif du foyer, trié (priorités d'abord), avec la date du jour du foyer. */
export async function getPantry() {
  const { household } = await getCurrentContext();
  if (!household) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pantry_items")
    .select(
      "id, ingredient_id, location, quantity_base, dimension, display_unit, expires_on, expiry_kind, opened_at, version, ingredients (name, category, slug)",
    )
    .eq("household_id", household.id)
    .eq("status", "active")
    .limit(500);
  if (error) throw new Error(`Lecture du garde-manger impossible : ${error.message}`);

  const today = todayIn(household.timezone);
  const items: PantryItemView[] = (data ?? []).map((row) => {
    const expiry = {
      expiresOn: row.expires_on,
      expiryKind: row.expiry_kind,
      openedAt: row.opened_at,
    };
    return {
      id: row.id,
      ingredientId: row.ingredient_id,
      ingredientSlug: row.ingredients?.slug ?? null,
      ingredientName: row.ingredients?.name ?? "?",
      category: row.ingredients?.category ?? "",
      location: row.location,
      quantityBase: row.quantity_base === null ? null : String(row.quantity_base),
      dimension: row.dimension,
      displayUnit: row.display_unit,
      ...expiry,
      version: row.version,
      priority: isPriority(expiry, today),
    };
  });

  items.sort(
    (a, b) =>
      comparePantryItems(a, b, today) || a.ingredientName.localeCompare(b.ingredientName, "fr"),
  );

  return { householdId: household.id, timezone: household.timezone, today, items };
}

/** Noms des ingrédients du référentiel, pour la saisie assistée. */
/** Ingrédients avec leurs synonymes, pour la recherche (« oeuf » -> « Œuf »). */
export async function getIngredientChoices(): Promise<IngredientChoice[]> {
  const supabase = await createSupabaseServerClient();
  const [ingredients, aliases] = await Promise.all([
    supabase.from("ingredients").select("id, name").order("name"),
    supabase.from("ingredient_aliases").select("alias_normalized, ingredient_id"),
  ]);
  if (ingredients.error)
    throw new Error(`Lecture du référentiel impossible : ${ingredients.error.message}`);
  if (aliases.error)
    throw new Error(`Lecture du référentiel impossible : ${aliases.error.message}`);
  const byId = new Map<string, string[]>();
  for (const a of aliases.data) {
    const list = byId.get(a.ingredient_id);
    if (list) list.push(a.alias_normalized);
    else byId.set(a.ingredient_id, [a.alias_normalized]);
  }
  return ingredients.data.map((i) => ({ name: i.name, aliases: byId.get(i.id) ?? [] }));
}

export async function getIngredientNames(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("ingredients").select("name").order("name");
  if (error) throw new Error(`Lecture du référentiel impossible : ${error.message}`);
  return (data ?? []).map((r) => r.name);
}

export interface MovementView {
  id: number;
  kind: string;
  deltaBase: string | null;
  quantityAfterBase: string | null;
  dimension: "mass" | "volume" | "count";
  displayUnit: string;
  ingredientName: string;
  note: string | null;
  createdAt: string;
}

/** Historique des mouvements du foyer, du plus récent au plus ancien. */
export async function getStockHistory(limit = 100) {
  const { household } = await getCurrentContext();
  if (!household) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      "id, kind, delta_base, quantity_after_base, note, created_at, pantry_items (dimension, display_unit), ingredients (name)",
    )
    .eq("household_id", household.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Lecture de l'historique impossible : ${error.message}`);

  const movements: MovementView[] = (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    deltaBase: row.delta_base === null ? null : String(row.delta_base),
    quantityAfterBase: row.quantity_after_base === null ? null : String(row.quantity_after_base),
    dimension: row.pantry_items?.dimension ?? "mass",
    displayUnit: row.pantry_items?.display_unit ?? "g",
    ingredientName: row.ingredients?.name ?? "?",
    note: row.note,
    createdAt: row.created_at,
  }));

  return { timezone: household.timezone, movements };
}
