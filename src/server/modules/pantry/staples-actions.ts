"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { toActionError } from "@/server/errors";
import { requireUser } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

const schema = z.object({
  householdId: z.uuid(),
  staples: z.array(z.uuid()).max(200),
});

export type StaplesState = { status: "idle" | "error" | "success"; message?: string };

/**
 * Enregistre le placard coché. On n'écrit que la différence avec l'état actuel :
 * renvoyer le même formulaire (double clic, nouvel essai) ne change rien.
 */
export async function saveStaplesAction(
  _prev: StaplesState,
  formData: FormData,
): Promise<StaplesState> {
  await requireUser();
  const parsed = schema.safeParse({
    householdId: formData.get("householdId"),
    staples: formData.getAll("staples"),
  });
  if (!parsed.success) return { status: "error", message: "Sélection invalide." };
  const { householdId, staples } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const current = await supabase
    .from("household_staples")
    .select("ingredient_id")
    .eq("household_id", householdId);
  if (current.error) return { status: "error", message: toActionError(current.error).message };

  const wanted = new Set(staples);
  const have = new Set(current.data.map((c) => c.ingredient_id));
  const toAdd = [...wanted].filter((id) => !have.has(id));
  const toRemove = [...have].filter((id) => !wanted.has(id));

  if (toAdd.length) {
    const { error } = await supabase.from("household_staples").upsert(
      toAdd.map((ingredient_id) => ({ household_id: householdId, ingredient_id })),
      { onConflict: "household_id,ingredient_id", ignoreDuplicates: true },
    );
    if (error) return { status: "error", message: toActionError(error).message };
  }
  if (toRemove.length) {
    const { error } = await supabase
      .from("household_staples")
      .delete()
      .eq("household_id", householdId)
      .in("ingredient_id", toRemove);
    if (error) return { status: "error", message: toActionError(error).message };
  }

  refresh();
  return {
    status: "success",
    message: `Placard enregistré : ${wanted.size} produit${wanted.size > 1 ? "s" : ""}.`,
  };
}
