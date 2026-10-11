"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { parseAmount, UNITS, isUnitCode } from "@/domain/units";
import { todayIn } from "@/lib/dates";
import { isMonday, mondayOf } from "@/lib/week";
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

// ---------------------------------------------------------------------------
// Ajouts manuels (migration 0021) : jamais fusionnés avec les besoins calculés.
// ---------------------------------------------------------------------------

const UNIQUE_VIOLATION = "23505";

export type ExtraState = { status: "idle" | "error" | "success"; message?: string };

async function currentWeekContext() {
  const { household } = await getCurrentContext();
  if (!household) return null;
  return { household, week: mondayOf(todayIn(household.timezone)) };
}

const extraSchema = z.object({
  label: z.string().trim().min(1).max(120),
  quantity: z.string().trim().max(40).optional(),
  ingredientId: z.uuid().optional(),
  recipeId: z.uuid().optional(),
});

/** Ajoute un article à la liste de la semaine en cours (idempotent pour un ingrédient). */
export async function addExtraAction(_prev: ExtraState, formData: FormData): Promise<ExtraState> {
  const ctx = await currentWeekContext();
  if (!ctx) return { status: "error", message: "Aucun foyer actif." };
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string" && v !== ""),
  );
  const parsed = extraSchema.safeParse(raw);
  if (!parsed.success)
    return { status: "error", message: "Indique un article (120 caractères max)." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("shopping_extras").insert({
    household_id: ctx.household.id,
    week_start: ctx.week,
    label: parsed.data.label,
    quantity_text: parsed.data.quantity || null,
    ingredient_id: parsed.data.ingredientId ?? null,
    source_recipe_id: parsed.data.recipeId ?? null,
  });
  if (error && error.code !== UNIQUE_VIOLATION) {
    return { status: "error", message: toActionError(error).message };
  }
  refresh();
  return {
    status: "success",
    message: error ? "Déjà sur la liste." : `« ${parsed.data.label} » ajouté à la liste.`,
  };
}

const manySchema = z
  .array(
    z.object({
      ingredientId: z.uuid(),
      label: z.string().trim().min(1).max(120),
      quantity: z.string().trim().max(40),
    }),
  )
  .min(1)
  .max(40);

/** « Tout ajouter » : les ingrédients manquants d'une recette, chacun une seule fois. */
export async function addManyExtrasAction(
  _prev: ExtraState,
  formData: FormData,
): Promise<ExtraState> {
  const ctx = await currentWeekContext();
  if (!ctx) return { status: "error", message: "Aucun foyer actif." };
  const recipeId = z.uuid().safeParse(formData.get("recipeId"));
  let items: z.infer<typeof manySchema>;
  try {
    items = manySchema.parse(JSON.parse(String(formData.get("items") ?? "[]")));
  } catch {
    return { status: "error", message: "Rien à ajouter." };
  }
  const supabase = await createSupabaseServerClient();
  let added = 0;
  for (const item of items) {
    const { error } = await supabase.from("shopping_extras").insert({
      household_id: ctx.household.id,
      week_start: ctx.week,
      label: item.label,
      quantity_text: item.quantity || null,
      ingredient_id: item.ingredientId,
      source_recipe_id: recipeId.success ? recipeId.data : null,
    });
    if (error && error.code !== UNIQUE_VIOLATION) {
      return { status: "error", message: toActionError(error).message };
    }
    if (!error) added += 1;
  }
  refresh();
  return {
    status: "success",
    message:
      added === 0
        ? "Tout était déjà sur la liste."
        : `${added} article${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""} à la liste.`,
  };
}

const extraIdSchema = z.object({ id: z.uuid(), checked: z.enum(["true", "false"]).optional() });

export async function toggleExtraAction(formData: FormData): Promise<void> {
  const parsed = extraIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !parsed.data.checked) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("shopping_extras")
    .update({ checked: parsed.data.checked === "true" })
    .eq("id", parsed.data.id);
  if (error) throw new Error(toActionError(error).message);
  refresh();
}

export async function removeExtraAction(formData: FormData): Promise<void> {
  const parsed = extraIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("shopping_extras").delete().eq("id", parsed.data.id);
  if (error) throw new Error(toActionError(error).message);
  refresh();
}

const checkAllSchema = z.object({
  week: z.string().refine(isMonday),
  lines: z.string(),
});

/** « Tout cocher » : coche toutes les lignes calculées et tous les ajouts de la semaine. */
export async function checkAllAction(formData: FormData): Promise<void> {
  const { household } = await getCurrentContext();
  if (!household) return;
  const parsed = checkAllSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const lines = z
    .array(z.object({ i: z.uuid(), d: z.enum(["mass", "volume", "count"]) }))
    .max(200)
    .safeParse(JSON.parse(parsed.data.lines));
  if (!lines.success) return;
  const supabase = await createSupabaseServerClient();
  if (lines.data.length) {
    const { error } = await supabase.from("shopping_checks").upsert(
      lines.data.map((l) => ({
        household_id: household.id,
        week_start: parsed.data.week,
        ingredient_id: l.i,
        dimension: l.d,
      })),
      { onConflict: "household_id,week_start,ingredient_id,dimension", ignoreDuplicates: true },
    );
    if (error) throw new Error(toActionError(error).message);
  }
  const { error } = await supabase
    .from("shopping_extras")
    .update({ checked: true })
    .eq("household_id", household.id)
    .eq("week_start", parsed.data.week);
  if (error) throw new Error(toActionError(error).message);
  refresh();
}
