"use client";

import { useActionState, useState } from "react";
import { ExpenseFields } from "@/components/budget/expense-fields";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { centsToInput } from "@/domain/money";
import {
  addExpenseAction,
  deleteExpenseAction,
  updateExpenseAction,
  type ExpenseState,
} from "@/server/modules/budget/actions";

const idle: ExpenseState = { status: "idle" };

/**
 * Formulaire ouvert à la demande, refermé dès que l'envoi réussit : on retient l'état de
 * l'action au moment de l'ouverture, et un nouvel état « success » le referme.
 */
function useOpenUntilSuccess(state: ExpenseState): [boolean, (open: boolean) => void] {
  const [openedAt, setOpenedAt] = useState<ExpenseState | null>(null);
  const open = openedAt !== null && !(state.status === "success" && state !== openedAt);
  return [open, (next) => setOpenedAt(next ? state : null)];
}

/** « Ajouter une dépense » : un achat payé en dehors de « Finir les courses ». */
export function AddExpenseForm({
  formKey,
  today,
  store,
}: {
  formKey: string;
  today: string;
  store: string | null;
}) {
  const [state, action, pending] = useActionState(addExpenseAction, idle);
  const [open, setOpen] = useOpenUntilSuccess(state);

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        {state.status === "success" ? <Alert tone="success">{state.message}</Alert> : null}
        <Button variant="secondary" className="self-start" onClick={() => setOpen(true)}>
          <PlusIcon size={18} />
          Ajouter une dépense
        </Button>
      </div>
    );
  }
  return (
    <form
      key={formKey}
      action={action}
      className="bg-surface border-border flex flex-col gap-4 rounded-3xl border p-4 sm:p-5"
      noValidate
    >
      <input type="hidden" name="key" value={formKey} />
      <p className="font-semibold">Nouvelle dépense</p>
      {state.status === "error" && !state.field ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}
      <ExpenseFields
        store={store ?? ""}
        spentOn={today}
        maxDate={today}
        error={state.status === "error" ? state : undefined}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

/** Correction ou suppression d'une dépense déjà saisie. */
export function EditExpense({
  expense,
  today,
}: {
  expense: {
    id: string;
    spentOn: string;
    storeLabel: string | null;
    amountCents: number;
    nonFoodCents: number;
  };
  today: string;
}) {
  const [state, action, pending] = useActionState(updateExpenseAction, idle);
  const [open, setOpen] = useOpenUntilSuccess(state);

  if (!open) {
    return (
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" className="min-h-9 px-3 text-sm" onClick={() => setOpen(true)}>
          Corriger
        </Button>
        <form action={deleteExpenseAction}>
          <input type="hidden" name="id" value={expense.id} />
          <Button
            type="submit"
            variant="ghost"
            className="text-danger min-h-9 px-3 text-sm"
            aria-label={`Supprimer la dépense du ${expense.spentOn}`}
          >
            Supprimer
          </Button>
        </form>
      </div>
    );
  }
  return (
    <form action={action} className="flex w-full flex-col gap-4 pt-2" noValidate>
      <input type="hidden" name="id" value={expense.id} />
      {state.status === "error" && !state.field ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}
      <ExpenseFields
        amount={centsToInput(expense.amountCents)}
        nonFood={expense.nonFoodCents ? centsToInput(expense.nonFoodCents) : ""}
        store={expense.storeLabel ?? ""}
        spentOn={expense.spentOn}
        maxDate={today}
        error={state.status === "error" ? state : undefined}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
