import { apiFetch } from "./client";
import type { DirectedBalance } from "./types";

export function getOverallBalances(): Promise<{
  balances: DirectedBalance[];
}> {
  return apiFetch<{ balances: DirectedBalance[] }>("/balances");
}

export function getGroupBalances(
  groupId: string,
): Promise<{ balances: DirectedBalance[] }> {
  return apiFetch<{ balances: DirectedBalance[] }>(
    `/groups/${groupId}/balances`,
  );
}
