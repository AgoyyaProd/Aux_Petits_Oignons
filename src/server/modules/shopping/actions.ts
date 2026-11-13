"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { parseExpense } from "@/domain/budget/expense-form";
import { parseAmount, UNITS, isUnitCode } from "@/domain/units";
import { todayIn } from "@/lib/dates";
import { isMonday, mondayOf } from "@/lib/week";
import { toActionError } from "@/server/errors";
import { getCurrentContext } from "@/server/modules/auth/session";
import { getShoppingPage } from "@/server/modules/shopping/queries";
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
  /** Champ de la dépense en erreur. */
  expenseField?: "amount" | "nonFood" | "spentOn" | "store";
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

  // Montant payé (facultatif). Enregistré avant le rangement : une fois les produits au
  // garde-manger, la liste se recalcule depuis le stock et son estimation serait perdue.
  // Même clé que le rangement : un double envoi n'enregistre qu'une dépense.
  const paid = String(formData.get("amount") ?? "").trim();
  let expenseSaved = false;
  if (paid !== "") {
    const today = todayIn(household.timezone);
    const parsed = parseExpense(
      {
        amount: paid,
        nonFood: String(formData.get("nonFood") ?? ""),
        store: String(formData.get("store") ?? ""),
      },
      today,
    );
    if (!parsed.ok) {
      return { status: "error", message: parsed.message, expenseField: parsed.field };
    }
    const estimate = await estimateOfLines(week, lines);
    const { error: expenseError } = await supabase.from("household_expenses").upsert(
      {
        household_id: household.id,
        idempotency_key: key,
        week_start: week,
        spent_on: parsed.value.spentOn,
        store_label: parsed.value.storeLabel,
        amount_cents: parsed.value.amountCents,
        non_food_cents: parsed.value.nonFoodCents,
        estimated_store_cents: estimate?.store ?? null,
        estimated_meals_cents: estimate?.meals ?? null,
        estimate_is_minimum: estimate?.isMinimum ?? false,
        source: "courses",
      },
      { onConflict: "household_id,idempotency_key", ignoreDuplicates: true },
    );
    if (expenseError) {
      return {
        status: "error",
        message:
          expenseError.code === "23514"
            ? "Montant payé refusé : vérifie la semaine et les montants."
            : toActionError(expenseError).message,
      };
    }
    expenseSaved = true;
  }

  const { data, error } = await supabase.rpc("shopping_finish", {
    p_household_id: household.id,
    p_week_start: week,
    p_items: items,
    p_idempotency_key: key,
  });
  if (error) return { status: "error", message: toActionError(error).message };

  // Les lignes rangées sont couvertes par le stock : leurs coches n'ont plus lieu d'être.
  // Une requête par dimension (au plus trois) au lieu d'une par ligne.
  const byDimension = new Map<"mass" | "volume" | "count", string[]>();
  for (const line of lines) {
    const d = line.dimension as "mass" | "volume" | "count";
    byDimension.set(d, [...(byDimension.get(d) ?? []), line.ingredientId]);
  }
  await Promise.all(
    [...byDimension].map(([dimension, ids]) =>
      supabase
        .from("shopping_checks")
        .delete()
        .eq("household_id", household.id)
        .eq("week_start", week)
        .eq("dimension", dimension)
        .in("ingredient_id", ids),
    ),
  );
  refresh();
  const n = (data as { put_away?: { count?: number } | null } | null)?.put_away?.count ?? 0;
  const done =
    n > 0
      ? `Courses terminées : ${n} produit${n > 1 ? "s" : ""} rangé${n > 1 ? "s" : ""} au garde-manger.`
      : "Courses terminées.";
  return {
    status: "success",
    message: expenseSaved ? `${done} Montant payé ajouté au budget.` : done,
  };
}

/**
 * Estimation de la liste pour les lignes rangées, figée sur la dépense : à payer en magasin
 * (paquets entiers) et part destinée aux plats. Une ligne sans prix rend l'estimation
 * minimale ; sans aucune ligne chiffrée, pas d'estimation (null), jamais 0 € inventé.
 */
async function estimateOfLines(
  week: string,
  lines: readonly { ingredientId: string; dimension: string }[],
): Promise<{ store: number; meals: number; isMinimum: boolean } | null> {
  const page = await getShoppingPage(week);
  if (!page || !("aisles" in page) || lines.length === 0) return null;
  const wanted = new Set(lines.map((l) => `${l.ingredientId}|${l.dimension}`));
  let store = 0;
  let meals = 0;
  let priced = 0;
  let isMinimum = false;
  for (const line of page.aisles.flatMap((a) => a.lines)) {
    if (!wanted.has(`${line.ingredientId}|${line.dimension}`)) continue;
    if (line.storeCents === null || line.cents === null) {
      isMinimum = true;
      continue;
    }
    priced += 1;
    store += line.storeCents;
    meals += Math.min(line.cents, line.storeCents);
  }
  return priced > 0 ? { store, meals, isMinimum } : null;
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
  // Une lecture des articles déjà présents, puis une seule insertion pour les nouveaux.
  const present = await supabase
    .from("shopping_extras")
    .select("ingredient_id")
    .eq("household_id", ctx.household.id)
    .eq("week_start", ctx.week)
    .in(
      "ingredient_id",
      items.map((i) => i.ingredientId),
    );
  if (present.error) return { status: "error", message: toActionError(present.error).message };
  const already = new Set(present.data.map((p) => p.ingredient_id));
  const fresh = [...new Map(items.map((i) => [i.ingredientId, i])).values()].filter(
    (i) => !already.has(i.ingredientId),
  );
  const rows = fresh.map((item) => ({
    household_id: ctx.household.id,
    week_start: ctx.week,
    label: item.label,
    quantity_text: item.quantity || null,
    ingredient_id: item.ingredientId,
    source_recipe_id: recipeId.success ? recipeId.data : null,
  }));
  let added = 0;
  if (rows.length) {
    const { error } = await supabase.from("shopping_extras").insert(rows);
    if (!error) added = rows.length;
    else if (error.code !== UNIQUE_VIOLATION) {
      return { status: "error", message: toActionError(error).message };
    } else {
      // Ajout simultané depuis un autre appareil : on retombe sur un ajout ligne à ligne.
      for (const row of rows) {
        const one = await supabase.from("shopping_extras").insert(row);
        if (one.error && one.error.code !== UNIQUE_VIOLATION) {
          return { status: "error", message: toActionError(one.error).message };
        }
        if (!one.error) added += 1;
      }
    }
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
  let raw: unknown;
  try {
    raw = JSON.parse(parsed.data.lines);
  } catch {
    return;
  }
  const lines = z
    .array(z.object({ i: z.uuid(), d: z.enum(["mass", "volume", "count"]) }))
    .max(200)
    .safeParse(raw);
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
