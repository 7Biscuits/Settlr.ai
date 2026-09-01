import { apiFetch } from "./client";
import type { Transaction } from "./types";

/** Generates a unique idempotency key so the backend can dedupe retries. */
export function newIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getWalletBalance(): Promise<{ balance: number }> {
  return apiFetch<{ balance: number }>("/wallet");
}

export function listTransactions(
  limit: number = 20,
  offset: number = 0,
): Promise<{
  transactions: Transaction[];
}> {
  return apiFetch<{ transactions: Transaction[] }>(
    `/wallet/transactions?limit=${limit}&offset=${offset}`,
  );
}

export function topUp(
  amount: number,
  idempotencyKey: string,
): Promise<{ balance: number; transaction: Transaction }> {
  return apiFetch<{ balance: number; transaction: Transaction }>(
    "/wallet/topup",
    {
      method: "POST",
      body: JSON.stringify({ amount, idempotencyKey }),
    },
  );
}

export function transfer(
  toUserId: string,
  amount: number,
  idempotencyKey: string,
): Promise<{ transaction: Transaction }> {
  return apiFetch<{ transaction: Transaction }>("/wallet/transfer", {
    method: "POST",
    body: JSON.stringify({ toUserId, amount, idempotencyKey }),
  });
}

export function settle(
  groupId: string,
  toUserId: string,
  amount: number,
  idempotencyKey: string,
): Promise<{ settlement: unknown; transactionId: string }> {
  return apiFetch<{ settlement: unknown; transactionId: string }>(
    "/wallet/settle",
    {
      method: "POST",
      body: JSON.stringify({ groupId, toUserId, amount, idempotencyKey }),
    },
  );
}
