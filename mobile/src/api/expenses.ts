import { apiFetch } from "./client";
import type { Expense, ExpenseWithSplits } from "./types";

export interface CreateExpenseParticipant {
  userId: string;
  amount?: number; // integer minor units, required for custom splits
}

export interface CreateExpenseInput {
  description: string;
  amount: number; // integer minor units
  paidBy: string;
  splitType: "equal" | "custom";
  participants: CreateExpenseParticipant[];
}

export function listExpenses(
  groupId: string,
): Promise<{ expenses: Expense[] }> {
  return apiFetch<{ expenses: Expense[] }>(`/groups/${groupId}/expenses`);
}

export function createExpense(
  groupId: string,
  input: CreateExpenseInput,
): Promise<{ expense: ExpenseWithSplits }> {
  return apiFetch<{ expense: ExpenseWithSplits }>(
    `/groups/${groupId}/expenses`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getExpense(
  id: string,
): Promise<{ expense: ExpenseWithSplits }> {
  return apiFetch<{ expense: ExpenseWithSplits }>(`/expenses/${id}`);
}
