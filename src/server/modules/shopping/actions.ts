"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { parseAmount, UNITS, isUnitCode } from "@/domain/units";
import { isMonday } from "@/lib/week";
import { toActionError } from "@/server/errors";
import { getCurrentContext } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

const checkSchema = z.object({
  week: z.string().refine(isMonday),
  ingredientId: z.uuid(),
  dimension: z.enum(["mass", "volume", "count"]),
  checked: z.enum(["true", "false"]),
});

/** Coche ou décoche une ligne « dans le panier ». Idempotent dans les deux sens. */
export async function toggleCheckAction(formData: FormData): Promise<void> {
  const { household } = await getCurrentContext();
  if (!household) return;
  const parsed = checkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { week, ingredientId, dimension, checked } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const query =
    checked === "true"
      ? supabase.from("shopping_checks").upsert(
          {
            household_id: household.id,
            week_start: week,
            ingredient_id: ingredientId,
            dimension,
          },
          {
            onConflict: "household_id,week_start,ingredient_id,dimension",
            ignoreDuplicates: true,
          },
        )
      : supabase
          .from("shopping_checks")
          .delete()
          .eq("household_id", household.id)
          .eq("week_start", week)
          .eq("ingredient_id", ingredientId)
          .eq("dimension", dimension);
  const { error } = await query;
  if (error) throw new Error(toActionError(error).message);
  refresh();
}

export type PutAwayState = {
  status: "idle" | "error" | "success";
  message?: string;
  /** Index des lignes en erreur, pour les signaler dans le formulaire. */
  invalid?: number[];
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * « Finir les courses » : range les produits cochés au garde-manger (s'il y en a) et marque
 * les courses de la semaine comme faites, en une seule transaction (shopping_finish).
 * La clé vient du formulaire : un double envoi ne range qu'une fois.
 */
export async function finishShoppingAction(
  _prev: PutAwayState,
  formData: FormData,
): Promise<PutAwayState> {
  const { household } = await getCurrentContext();
  if (!household) return { status: "error", message: "Aucun foyer actif." };
  const week = String(formData.get("week") ?? "");
  const key = String(formData.get("key") ?? "");
  const count = Number(formData.get("count"));
  if (
    !isMonday(week) ||
    !z.uuid().safeParse(key).success ||
    !Number.isInteger(count) ||
    count < 0 ||
    count > 100
  ) {
    return { status: "error", message: "Formulaire expiré, recharge la page." };
  }

  const items: Record<string, string | null>[] = [];
  const invalid: number[] = [];
  const lines: { ingredientId: string; dimension: string }[] = [];
  for (let i = 0; i < count; i += 1) {
    if (formData.get(`include-${i}`) !== "on") continue;
    const ingredientId = String(formData.get(`ingredientId-${i}`) ?? "");
    const unit = String(formData.get(`unit-${i}`) ?? "");
    const location = String(formData.get(`location-${i}`) ?? "");
    const expiresOn = String(formData.get(`expiresOn-${i}`) ?? "").trim();
    const expiryKind = String(formData.get(`expiryKind-${i}`) ?? "use_by");
    let quantity: string | null = null;
    try {
      const milli = parseAmount(String(formData.get(`quantity-${i}`) ?? ""));
      if (milli > 0)
        quantity = `${Math.floor(milli / 1000)}.${String(milli % 1000).padStart(3, "0")}`;
    } catch {
      quantity = null;
    }
    const ok =
      z.uuid().safeParse(ingredientId).success &&
      isUnitCode(unit) &&
      quantity !== null &&
      ["pantry", "fridge", "freezer"].includes(location) &&
      (expiresOn === "" || ISO.test(expiresOn)) &&
      ["use_by", "best_before"].includes(expiryKind);
    if (!ok) {
      invalid.push(i);
      continue;
    }
    items.push({
      ingredient_id: ingredientId,
      quantity,
      unit,
      location,
      expires_on: expiresOn || null,
      expiry_kind: expiresOn ? expiryKind : null,
    });
    lines.push({ ingredientId, dimension: UNITS[unit as keyof typeof UNITS].dimension });
  }
  if (invalid.length) {
    return {
      status: "error",
      message: "Vérifie les quantités (nombre positif, ex. 1,5) et les dates.",
      invalid,
    };
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("shopping_finish", {
    p_household_id: household.id,
    p_week_start: week,
    p_items: items,
    p_idempotency_key: key,
  });
  if (error) return { status: "error", message: toActionError(error).message };

  // Les lignes rangées sont couvertes par le stock : leurs coches n'ont plus lieu d'être.
  for (const line of lines) {
    await supabase
      .from("shopping_checks")
      .delete()
      .eq("household_id", household.id)
      .eq("week_start", week)
      .eq("ingredient_id", line.ingredientId)
      .eq("dimension", line.dimension as "mass" | "volume" | "count");
  }
  refresh();
  const n = (data as { put_away?: { count?: number } | null } | null)?.put_away?.count ?? 0;
  return {
    status: "success",
    message:
      n > 0
        ? `Courses terminées : ${n} produit${n > 1 ? "s" : ""} rangé${n > 1 ? "s" : ""} au garde-manger.`
        : "Courses terminées.",
  };
}
