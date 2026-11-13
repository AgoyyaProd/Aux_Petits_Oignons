"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { parseExpense } from "@/domain/budget/expense-form";
import { todayIn } from "@/lib/dates";
import { mondayOf } from "@/lib/week";
import { toActionError } from "@/server/errors";
import { getCurrentContext } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type ExpenseState = {
  status: "idle" | "error" | "success";
  message?: string;
  field?: "amount" | "nonFood" | "spentOn" | "store";
};

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "");

/**
 * Ajoute une dépense payée en dehors de « Finir les courses » (page Budget). Rattachée à la
 * semaine de sa date. La clé vient du formulaire : un double envoi n'enregistre qu'une fois.
 */
export async function addExpenseAction(
  _prev: ExpenseState,
  formData: FormData,
): Promise<ExpenseState> {
  const { household } = await getCurrentContext();
  if (!household) return { status: "error", message: "Aucun foyer actif." };
  const key = text(formData, "key");
  if (!z.uuid().safeParse(key).success) {
    return { status: "error", message: "Formulaire expiré, recharge la page." };
  }
  const parsed = parseExpense(
    {
      amount: text(formData, "amount"),
      nonFood: text(formData, "nonFood"),
      store: text(formData, "store"),
      spentOn: text(formData, "spentOn"),
    },
    todayIn(household.timezone),
  );
  if (!parsed.ok) return { status: "error", message: parsed.message, field: parsed.field };
  const v = parsed.value;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("household_expenses").upsert(
    {
      household_id: household.id,
      idempotency_key: key,
      week_start: mondayOf(v.spentOn),
      spent_on: v.spentOn,
      store_label: v.storeLabel,
      amount_cents: v.amountCents,
      non_food_cents: v.nonFoodCents,
      source: "manuel",
    },
    { onConflict: "household_id,idempotency_key", ignoreDuplicates: true },
  );
  if (error) return { status: "error", message: toActionError(error).message };
  refresh();
  return { status: "success", message: "Dépense enregistrée." };
}

/** Corrige une dépense : montant, part non alimentaire, date et magasin. */
export async function updateExpenseAction(
  _prev: ExpenseState,
  formData: FormData,
): Promise<ExpenseState> {
  const { household } = await getCurrentContext();
  if (!household) return { status: "error", message: "Aucun foyer actif." };
  const id = text(formData, "id");
  if (!z.uuid().safeParse(id).success) {
    return { status: "error", message: "Dépense introuvable, recharge la page." };
  }
  const parsed = parseExpense(
    {
      amount: text(formData, "amount"),
      nonFood: text(formData, "nonFood"),
      store: text(formData, "store"),
      spentOn: text(formData, "spentOn"),
    },
    todayIn(household.timezone),
  );
  if (!parsed.ok) return { status: "error", message: parsed.message, field: parsed.field };
  const v = parsed.value;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("household_expenses")
    .update({
      amount_cents: v.amountCents,
      non_food_cents: v.nonFoodCents,
      store_label: v.storeLabel,
      spent_on: v.spentOn,
    })
    .eq("id", id)
    .eq("household_id", household.id)
    .select("id");
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23514"
          ? "Cette date est trop loin de la semaine de la dépense : supprime-la et saisis-la à nouveau."
          : toActionError(error).message,
    };
  }
  if (!data?.length) return { status: "error", message: "Dépense introuvable, recharge la page." };
  refresh();
  return { status: "success", message: "Dépense corrigée." };
}

/** Supprime une dépense (faute de saisie). Sans effet si elle n'existe déjà plus. */
export async function deleteExpenseAction(formData: FormData): Promise<void> {
  const { household } = await getCurrentContext();
  if (!household) return;
  const id = text(formData, "id");
  if (!z.uuid().safeParse(id).success) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("household_expenses")
    .delete()
    .eq("id", id)
    .eq("household_id", household.id);
  if (error) throw new Error(toActionError(error).message);
  refresh();
}
