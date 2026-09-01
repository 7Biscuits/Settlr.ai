import { getOverallBalancesForUser, type DirectedBalance } from "./balanceService.js";
import { listGroupsForUser } from "./groupService.js";
import { getWalletBalance, listTransactions } from "./walletService.js";
import { db } from "../database/client.js";
import { users } from "../database/schema/users.js";
import { inArray } from "drizzle-orm";
import type { Group } from "../database/schema/groups.js";
import type { Transaction } from "../database/schema/transactions.js";

export interface ActivityItem {
  id: string;
  type: string;
  amount: number; // positive (credit) or negative (debit)
  status: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalOwed: number;
  totalOwing: number;
  walletBalance: number;
  balances: DirectedBalance[];
  groups: Group[];
  recentActivity: ActivityItem[];
  rawTransactions: Transaction[];
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
    listTransactions(userId, { limit: 10, offset: 0 }),
  ]);

  let totalOwed = 0;
  let totalOwing = 0;
  for (const balance of balances) {
    if (balance.netAmount > 0) totalOwed += balance.netAmount;
    if (balance.netAmount < 0) totalOwing += -balance.netAmount;
  }

  // Collect user IDs for name resolution
  const userIds = new Set<string>();
  for (const t of transactions) {
    if (t.fromUserId) userIds.add(t.fromUserId);
    if (t.toUserId) userIds.add(t.toUserId);
  }

  const userRows =
    userIds.size > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, Array.from(userIds)))
      : [];

  const nameMap = new Map<string, string>(userRows.map((u) => [u.id, u.name]));

  const recentActivity: ActivityItem[] = transactions.slice(0, 6).map((t) => {
    let typeDescription = "Wallet Activity";
    let signedAmount = t.amount;

    if (t.type === "topup") {
      typeDescription = "Wallet Top Up";
      signedAmount = Math.abs(t.amount);
    } else if (t.type === "transfer") {
      if (t.fromUserId === userId) {
        const toName = t.toUserId ? nameMap.get(t.toUserId) ?? "User" : "User";
        typeDescription = `Transferred to ${toName}`;
        signedAmount = -Math.abs(t.amount);
      } else {
        const fromName = t.fromUserId
          ? nameMap.get(t.fromUserId) ?? "User"
          : "User";
        typeDescription = `Received from ${fromName}`;
        signedAmount = Math.abs(t.amount);
      }
    } else if (t.type === "settlement") {
      if (t.fromUserId === userId) {
        const toName = t.toUserId ? nameMap.get(t.toUserId) ?? "User" : "User";
        typeDescription = `Settled to ${toName}`;
        signedAmount = -Math.abs(t.amount);
      } else {
        const fromName = t.fromUserId
          ? nameMap.get(t.fromUserId) ?? "User"
          : "User";
        typeDescription = `Settlement from ${fromName}`;
        signedAmount = Math.abs(t.amount);
      }
    }

    return {
      id: t.id,
      type: typeDescription,
      amount: signedAmount,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    };
  });

  return {
    totalOwed,
    totalOwing,
    walletBalance,
    balances,
    groups,
    recentActivity,
    rawTransactions: transactions.slice(0, 5),
  };
}
