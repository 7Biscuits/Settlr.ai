import { db, type DbExecutor } from "../database/client.js";
import { balances, type Balance } from "../database/schema/balances.js";
import { groupMembers } from "../database/schema/groupMembers.js";
import { users } from "../database/schema/users.js";
import { assertMember } from "./groupService.js";
import { and, eq, or } from "drizzle-orm";

/**
 * Normalizes a directed debt into a canonical pair and applies a delta to the
 * pairwise balance ledger. `amount > 0` in a row means `creditorId` is owed by
 * `debtorId`. We always store the pair with a single canonical orientation and
 * keep a signed amount to avoid duplicate mirrored rows.
 */
async function adjustPair(
  tx: DbExecutor,
  groupId: string,
  creditorId: string,
  debtorId: string,
  delta: number,
): Promise<void> {
  if (delta === 0 || creditorId === debtorId) return;

  // Canonical orientation: smaller id is "a", larger is "b".
  const [a, b] =
    creditorId < debtorId ? [creditorId, debtorId] : [debtorId, creditorId];
  // Positive stored amount means `a` is owed by `b`.
  const signedDelta = creditorId === a ? delta : -delta;

  const [existing] = await tx
    .select()
    .from(balances)
    .where(
      and(
        eq(balances.groupId, groupId),
        eq(balances.creditorId, a),
        eq(balances.debtorId, b),
      ),
    )
    .for("update");

  if (existing) {
    await tx
      .update(balances)
      .set({ amount: existing.amount + signedDelta, updatedAt: new Date() })
      .where(eq(balances.id, existing.id));
  } else {
    await tx.insert(balances).values({
      groupId,
      creditorId: a,
      debtorId: b,
      amount: signedDelta,
    });
  }
}

/**
 * Applies an expense to the balance ledger: the payer is owed each
 * participant's share (except their own).
 */
export async function applyExpenseToBalances(
  tx: DbExecutor,
  input: {
    groupId: string;
    paidBy: string;
    splits: { userId: string; amountOwed: number }[];
  },
): Promise<void> {
  for (const split of input.splits) {
    if (split.userId === input.paidBy) continue;
    // payer is creditor, participant is debtor
    await adjustPair(
      tx,
      input.groupId,
      input.paidBy,
      split.userId,
      split.amountOwed,
    );
  }
}

/**
 * Applies a settlement: the debtor pays the creditor, reducing what the debtor
 * owes. This is called inside the settlement transaction after a verified
 * wallet transfer.
 */
export async function applySettlementToBalances(
  tx: DbExecutor,
  input: {
    groupId: string;
    fromUserId: string; // debtor paying
    toUserId: string; // creditor being paid
    amount: number;
  },
): Promise<void> {
  // Paying reduces the (toUser owed by fromUser) balance.
  await adjustPair(
    tx,
    input.groupId,
    input.toUserId,
    input.fromUserId,
    -input.amount,
  );
}

export interface DirectedBalance {
  otherUserId: string;
  otherUserName: string;
  // Positive => the queried user is owed this amount.
  // Negative => the queried user owes this amount.
  netAmount: number;
}

function rowToDirected(row: Balance, userId: string): {
  otherUserId: string;
  netAmount: number;
} | null {
  if (row.amount === 0) return null;
  if (row.creditorId === userId) {
    return { otherUserId: row.debtorId, netAmount: row.amount };
  }
  if (row.debtorId === userId) {
    return { otherUserId: row.creditorId, netAmount: -row.amount };
  }
  return null;
}

export async function getGroupBalancesForUser(
  groupId: string,
  userId: string,
): Promise<DirectedBalance[]> {
  await assertMember(groupId, userId);
  const rows = await db
    .select()
    .from(balances)
    .where(
      and(
        eq(balances.groupId, groupId),
        or(eq(balances.creditorId, userId), eq(balances.debtorId, userId)),
      ),
    );

  const result: DirectedBalance[] = [];
  for (const row of rows) {
    const directed = rowToDirected(row, userId);
    if (!directed) continue;
    const [other] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, directed.otherUserId));
    result.push({
      otherUserId: directed.otherUserId,
      otherUserName: other?.name ?? "Unknown",
      netAmount: directed.netAmount,
    });
  }
  return result;
}

export async function getOverallBalancesForUser(
  userId: string,
): Promise<DirectedBalance[]> {
  const rows = await db
    .select()
    .from(balances)
    .where(or(eq(balances.creditorId, userId), eq(balances.debtorId, userId)));

  const byUser = new Map<string, number>();
  for (const row of rows) {
    const directed = rowToDirected(row, userId);
    if (!directed) continue;
    byUser.set(
      directed.otherUserId,
      (byUser.get(directed.otherUserId) ?? 0) + directed.netAmount,
    );
  }

  const result: DirectedBalance[] = [];
  for (const [otherUserId, netAmount] of byUser.entries()) {
    if (netAmount === 0) continue;
    const [other] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, otherUserId));
    result.push({
      otherUserId,
      otherUserName: other?.name ?? "Unknown",
      netAmount,
    });
  }
  return result;
}

/**
 * How much does `userId` owe `otherUserId` overall (across groups)?
 * Positive result => userId owes otherUserId. Used by AI balance tools.
 */
export async function getNetOwedToUser(
  userId: string,
  otherUserId: string,
): Promise<number> {
  const overall = await getOverallBalancesForUser(userId);
  const entry = overall.find((b) => b.otherUserId === otherUserId);
  if (!entry) return 0;
  // netAmount positive => user is owed; owing is the negative of that.
  return -entry.netAmount;
}

/**
 * Resolves a member of `groupId` by (case-insensitive) name. Used by AI tools
 * that receive a natural-language name like "Rahul".
 */
export async function findGroupMemberByName(
  groupId: string,
  name: string,
): Promise<{ id: string; name: string } | null> {
  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId));
  const match = rows.find(
    (r) => r.name.toLowerCase() === name.toLowerCase().trim(),
  );
  return match ?? null;
}
