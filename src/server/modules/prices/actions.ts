"use server";

import { refresh } from "next/cache";
import { toActionError } from "@/server/errors";
import { getCurrentContext, requireUser } from "@/server/modules/auth/session";
import { firstErrors } from "@/server/modules/households/schema";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  householdPriceSchema,
  removeHouseholdPriceSchema,
  storeSchema,
  type PriceField,
  type PriceFormState,
} from "./schema";
import { syncReferencePrices } from "./sync";

/** Magasin de référence du foyer (réglage du propriétaire, contrôlé par la RLS). */
export async function saveReferenceStoreAction(
  _prev: PriceFormState,
  formData: FormData,
): Promise<PriceFormState> {
  await requireUser();
  const parsed = storeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Magasin invalide." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("households")
    .update({ reference_store: parsed.data.store })
    .eq("id", parsed.data.householdId)
    .select("id");
  if (error) return { status: "error", message: toActionError(error).message };
  if (!data?.length) {
    return { status: "error", message: "Seul le propriétaire du foyer peut modifier ce réglage." };
  }
  refresh();
  return { status: "success", message: "Magasin enregistré." };
}

/** Mon prix pour un ingrédient : remplace le prix indicatif. Ré-enregistrer met à jour. */
export async function saveHouseholdPriceAction(
  _prev: PriceFormState,
  formData: FormData,
): Promise<PriceFormState> {
  const { household } = await getCurrentContext();
  const parsed = householdPriceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstErrors<PriceField>(parsed.error) };
  }
  const supabase = await createSupabaseServerClient();
  const store = await supabase
    .from("households")
    .select("reference_store")
    .eq("id", parsed.data.householdId)
    .single();
  const { error } = await supabase.from("household_prices").upsert({
    household_id: parsed.data.householdId,
    ingredient_id: parsed.data.ingredientId,
    dimension: parsed.data.dimension,
    cents_per_ref: parsed.data.price,
    source_url: parsed.data.sourceUrl,
    store_label: store.data?.reference_store ?? null,
    observed_on: new Date().toLocaleDateString("en-CA", {
      timeZone: household?.timezone ?? "Europe/Paris",
    }),
  });
  if (error) return { status: "error", message: toActionError(error).message };
  refresh();
  return { status: "success", message: "Prix enregistré." };
}

export async function removeHouseholdPriceAction(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = removeHouseholdPriceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("household_prices")
    .delete()
    .eq("household_id", parsed.data.householdId)
    .eq("ingredient_id", parsed.data.ingredientId);
  if (error) throw new Error(toActionError(error).message);
  refresh();
}

export type SyncState = { status: "idle" | "error" | "success"; message?: string };

/**
 * Mise à jour des prix indicatifs, déclenchée par un administrateur. Les écritures passent
 * par sa session : la RLS vérifie qu'il est bien administrateur.
 */
export async function runPriceSyncAction(): Promise<SyncState> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: isAdmin } = await supabase.rpc("is_app_admin");
  if (!isAdmin) return { status: "error", message: "Réservé aux administrateurs." };
  try {
    const summary = await syncReferencePrices(supabase, { startedBy: user.id, deadlineMs: 50_000 });
    refresh();
    const rest = summary.timedOut
      ? ` ${summary.timedOut} ingrédient(s) seront traités à la prochaine mise à jour.`
      : "";
    return {
      status: "success",
      message: `${summary.updated} prix mis à jour depuis Open Prices, ${summary.receipts} depuis les tickets de caisse, ${summary.priced} ingrédients ont un prix indicatif sur ${summary.total}.${rest}`,
    };
  } catch (error) {
    console.error("Synchronisation des prix en échec", error);
    return { status: "error", message: "La mise à jour a échoué. Réessaie plus tard." };
  }
}
