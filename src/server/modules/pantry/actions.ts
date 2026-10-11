"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { ActionError } from "@/server/errors";
import { requireUser } from "@/server/modules/auth/session";
import { firstErrors } from "@/server/modules/households/schema";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { addItem, applyMovement, resolveIngredient, updateDetails } from "./repository";
import {
  addItemSchema,
  detailsSchema,
  echoValues,
  movementSchema,
  type PantryFormField,
  type PantryFormState,
} from "./schema";

function failure(error: unknown, formData: FormData): PantryFormState {
  const values = echoValues(formData);
  if (error instanceof ActionError) {
    // Conflit (modifié ailleurs, déjà épuisé) : recharger les données à jour.
    if (error.kind === "conflict") refresh();
    return { status: "error", message: error.message, values };
  }
  console.error("Action garde-manger en échec", error);
  return {
    status: "error",
    message: "Une erreur est survenue. Réessaie dans un instant.",
    values,
  };
}

/**
 * Ajout d'un produit. La clé d'idempotence vient du formulaire : un double envoi
 * ou un nouvel essai après coupure réseau ne crée jamais deux produits.
 */
export async function addPantryItemAction(
  _prev: PantryFormState,
  formData: FormData,
): Promise<PantryFormState> {
  await requireUser();
  const parsed = addItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: firstErrors<PantryFormField>(parsed.error),
      values: echoValues(formData),
    };
  }
  const input = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();
    const ingredientId = await resolveIngredient(supabase, input.ingredient);
    if (!ingredientId) {
      return {
        status: "error",
        fieldErrors: { ingredient: "Ingrédient inconnu : choisis-le dans la liste proposée." },
        values: echoValues(formData),
      };
    }
    const result = await addItem(supabase, {
      householdId: input.householdId,
      ingredientId,
      location: input.location,
      quantity: input.quantity,
      unit: input.unit,
      expiresOn: input.expiresOn,
      expiryKind: input.expiryKind,
      opened: input.opened,
      idempotencyKey: input.idempotencyKey,
      note: input.note,
    });
    refresh();
    return {
      status: "success",
      message: result.replayed ? "Produit déjà ajouté." : `${input.ingredient} ajouté.`,
      nextKey: randomUUID(),
    };
  } catch (error) {
    return failure(error, formData);
  }
}

export async function applyMovementAction(
  _prev: PantryFormState,
  formData: FormData,
): Promise<PantryFormState> {
  await requireUser();
  const parsed = movementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: firstErrors<PantryFormField>(parsed.error),
      values: echoValues(formData),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await applyMovement(supabase, parsed.data);
    refresh();
    const message =
      result.status === "discarded"
        ? "Produit retiré du stock."
        : result.status === "depleted"
          ? "Stock épuisé."
          : "Stock mis à jour.";
    return { status: "success", message, nextKey: randomUUID() };
  } catch (error) {
    return failure(error, formData);
  }
}

export async function updateDetailsAction(
  _prev: PantryFormState,
  formData: FormData,
): Promise<PantryFormState> {
  await requireUser();
  const parsed = detailsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: firstErrors<PantryFormField>(parsed.error),
      values: echoValues(formData),
    };
  }
  const { expiresOn, expiryKind } = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();
    await updateDetails(supabase, {
      ...parsed.data,
      expiryKind: expiresOn ? (expiryKind ?? "use_by") : null,
    });
    refresh();
    return { status: "success", message: "Détails enregistrés." };
  } catch (error) {
    return failure(error, formData);
  }
}
