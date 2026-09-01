import { getOverallBalancesForUser, type DirectedBalance } from "./balanceService.js";
import { listGroupsForUser } from "./groupService.js";
import { getWalletBalance, listTransactions } from "./walletService.js";
import type { Group } from "../database/schema/groups.js";
import type { Transaction } from "../database/schema/transactions.js";

export interface DashboardSummary {
  totalOwed: number;
  totalOwing: number;
  walletBalance: number;
  balances: DirectedBalance[];
  groups: Group[];
  recentActivity: Transaction[];
}

/**
 * Produces the dashboard's financial summary on the backend. The client only
 * renders these figures; it does not derive owed or owing totals locally.
 */
export async function getDashboardSummary(
  userId: string,
): Promise<DashboardSummary> {
  const [balances, walletBalance, groups, transactions] = await Promise.all([
    getOverallBalancesForUser(userId),
    getWalletBalance(userId),
    listGroupsForUser(userId),
    listTransactions(userId),
  ]);

  let totalOwed = 0;
  let totalOwing = 0;
  for (const balance of balances) {
    if (balance.netAmount > 0) totalOwed += balance.netAmount;
    if (balance.netAmount < 0) totalOwing += -balance.netAmount;
  }

  return {
    totalOwed,
    totalOwing,
    walletBalance,
    balances,
    groups,
    recentActivity: transactions.slice(0, 5),
  };
}
