import "server-only";
import { z } from "zod";
import { ActionError, toActionError } from "@/server/errors";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { Location } from "./schema";

/**
 * Appels aux fonctions de stock (migration 0007).
 * Les types générés déclarent tous les arguments non nuls ; les fonctions SQL
 * acceptent pourtant NULL (quantité inconnue, pas de date). Les signatures réelles
 * sont donc décrites ici, et la seule conversion de type est isolée dans `rpc()`.
 */
type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function rpc(supabase: Supabase, fn: string, args: Record<string, unknown>) {
  const { data, error } = await (
    supabase.rpc as unknown as (
      f: string,
      a: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>
  )(fn, args);
  if (error) throw toActionError(error);
  return data;
}

const stockResult = z.object({
  item_id: z.uuid(),
  quantity_base: z.number().nullable(),
  status: z.enum(["active", "depleted", "discarded"]),
  version: z.number().int(),
  replayed: z.boolean(),
});
export type StockResult = z.infer<typeof stockResult>;

function parseResult(data: unknown): StockResult {
  const parsed = stockResult.safeParse(data);
  if (!parsed.success) throw new ActionError("unexpected", "Réponse inattendue du serveur.");
  return parsed.data;
}

export async function resolveIngredient(supabase: Supabase, label: string): Promise<string | null> {
  const data = await rpc(supabase, "resolve_ingredient", { p_label: label });
  return typeof data === "string" ? data : null;
}

export async function addItem(
  supabase: Supabase,
  args: {
    householdId: string;
    ingredientId: string;
    location: Location;
    quantity: number | null;
    unit: string;
    expiresOn: string | null;
    expiryKind: "use_by" | "best_before" | null;
    opened: boolean;
    idempotencyKey: string;
    note?: string;
  },
): Promise<StockResult> {
  return parseResult(
    await rpc(supabase, "pantry_add_item", {
      p_household_id: args.householdId,
      p_ingredient_id: args.ingredientId,
      p_location: args.location,
      p_quantity: args.quantity,
      p_display_unit: args.unit,
      p_expires_on: args.expiresOn,
      p_expiry_kind: args.expiryKind,
      p_opened: args.opened,
      p_idempotency_key: args.idempotencyKey,
      p_note: args.note ?? null,
    }),
  );
}

export async function applyMovement(
  supabase: Supabase,
  args: {
    itemId: string;
    kind: "consumption" | "correction" | "loss";
    quantity: number | null;
    unit: string;
    expectedVersion: number;
    idempotencyKey: string;
    note?: string;
  },
): Promise<StockResult> {
  return parseResult(
    await rpc(supabase, "pantry_apply_movement", {
      p_item_id: args.itemId,
      p_kind: args.kind,
      p_quantity: args.quantity,
      p_unit: args.unit,
      p_expected_version: args.expectedVersion,
      p_idempotency_key: args.idempotencyKey,
      p_note: args.note ?? null,
    }),
  );
}

export async function updateDetails(
  supabase: Supabase,
  args: {
    itemId: string;
    expectedVersion: number;
    location: Location;
    expiresOn: string | null;
    expiryKind: "use_by" | "best_before" | null;
    opened: boolean;
  },
): Promise<void> {
  await rpc(supabase, "pantry_update_details", {
    p_item_id: args.itemId,
    p_expected_version: args.expectedVersion,
    p_location: args.location,
    p_expires_on: args.expiresOn,
    p_expiry_kind: args.expiryKind,
    p_opened: args.opened,
  });
}
