import { db } from "../database/client.js";
import { settlements, type Settlement } from "../database/schema/settlements.js";
import { balances } from "../database/schema/balances.js";
import {
  assertMatchingTransaction,
  findByIdempotencyKey,
  transferFundsInTransaction,
} from "./walletService.js";
import { applySettlementToBalances } from "./balanceService.js";
import { assertMember } from "./groupService.js";
import { ValidationError, ConflictError } from "../utils/errors.js";
import { and, eq } from "drizzle-orm";

/**
 * Settles a debt from `fromUserId` to `toUserId` within a group by moving
 * demo wallet funds and recording a settlement. The wallet transfer is the
 * authoritative financial step: balances are only updated after a verified,
 * successful transfer. Idempotent via `idempotencyKey`.
 */
export async function settleDebt(input: {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  idempotencyKey: string;
}): Promise<{ settlement: Settlement; transactionId: string }> {
  const { groupId, fromUserId, toUserId, amount, idempotencyKey } = input;

  if (fromUserId === toUserId) {
    throw new ValidationError("Cannot settle with yourself");
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ValidationError("Settlement amount must be a positive integer");
  }

  await assertMember(groupId, fromUserId);
  await assertMember(groupId, toUserId);

  return db.transaction(async (tx) => {
    const existingTransaction = await findByIdempotencyKey(tx, idempotencyKey);
    if (existingTransaction) {
      assertMatchingTransaction(existingTransaction, {
        type: "settlement",
        fromUserId,
        toUserId,
        amount,
      });
      const [existingSettlement] = await tx
        .select()
        .from(settlements)
        .where(eq(settlements.transactionId, existingTransaction.id));
      if (!existingSettlement || existingSettlement.groupId !== groupId) {
        throw new ConflictError(
          "This idempotency key was already used for a different settlement",
        );
      }
      return {
        settlement: existingSettlement,
        transactionId: existingTransaction.id,
      };
    }

    // Lock the group-specific ledger row before checking the debt and applying
    // the reduction, keeping the wallet movement and balance update atomic.
    const [a, b] =
      fromUserId < toUserId
        ? [fromUserId, toUserId]
        : [toUserId, fromUserId];
    const [balance] = await tx
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
    const owed = balance
      ? fromUserId === balance.creditorId
        ? -balance.amount
        : balance.amount
      : 0;
    if (owed <= 0) {
      throw new ConflictError("There is no outstanding debt to settle in this group");
    }
    if (amount > owed) {
      throw new ValidationError(
        `Settlement amount (${amount}) exceeds the outstanding debt (${owed})`,
      );
    }

    const txn = await transferFundsInTransaction(tx, {
      fromUserId,
      toUserId,
      amount,
      idempotencyKey,
      type: "settlement",
    });
    await applySettlementToBalances(tx, {
      groupId,
      fromUserId,
      toUserId,
      amount,
    });
    const [settlement] = await tx
      .insert(settlements)
      .values({
        groupId,
        fromUserId,
        toUserId,
        amount,
        transactionId: txn.id,
      })
      .returning();
    return { settlement: settlement!, transactionId: txn.id };
  });
}
