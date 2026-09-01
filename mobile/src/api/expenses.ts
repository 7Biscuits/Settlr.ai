import { apiFetch } from "./client";
import type {
  Expense,
  ExpenseWithSplits,
  SplitType,
  UploadReceiptResult,
} from "./types";

export interface ExpenseParticipantInput {
  userId: string;
  amount?: number; // integer minor units, required for custom splits
  percentage?: number; // percentage (0-100), required for percentage splits
  shares?: number; // positive integer weight, required for shares splits
}

export interface CreateExpenseInput {
  description: string;
  amount: number; // integer minor units
  paidBy: string;
  category?: string;
  receiptUrl?: string;
  splitType: SplitType;
  participants: ExpenseParticipantInput[];
}

export interface UpdateExpenseInput {
  description?: string;
  amount?: number;
  paidBy?: string;
  category?: string;
  receiptUrl?: string | null;
  splitType?: SplitType;
  participants?: ExpenseParticipantInput[];
}

export interface UploadReceiptInput {
  imageBase64: string;
  mimeType?: "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "application/pdf" | string;
  fileName?: string;
}

export interface AttachReceiptInput {
  receiptUrl?: string;
  imageBase64?: string;
  mimeType?: string;
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

export function updateExpense(
  id: string,
  input: UpdateExpenseInput,
): Promise<{ expense: ExpenseWithSplits }> {
  return apiFetch<{ expense: ExpenseWithSplits }>(`/expenses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteExpense(id: string): Promise<void> {
  return apiFetch<void>(`/expenses/${id}`, {
    method: "DELETE",
  });
}

export function uploadReceipt(
  input: UploadReceiptInput,
): Promise<UploadReceiptResult> {
  return apiFetch<UploadReceiptResult>("/expenses/receipts/upload", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function attachReceipt(
  id: string,
  input: AttachReceiptInput,
): Promise<{ expense: ExpenseWithSplits }> {
  return apiFetch<{ expense: ExpenseWithSplits }>(`/expenses/${id}/receipt`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
