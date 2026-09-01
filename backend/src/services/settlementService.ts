import { db } from "../database/client.js";
import { settlements, type Settlement } from "../database/schema/settlements.js";
import { transferFunds } from "./walletService.js";
import { applySettlementToBalances, getNetOwedToUser } from "./balanceService.js";
import { assertMember } from "./groupService.js";
import { ValidationError, ConflictError } from "../utils/errors.js";

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

  // Do not allow settling more than what is actually owed.
  const owed = await getNetOwedToUser(fromUserId, toUserId);
  if (owed <= 0) {
    throw new ConflictError("There is no outstanding debt to settle");
  }
  if (amount > owed) {
    throw new ValidationError(
      `Settlement amount (${amount}) exceeds the outstanding debt (${owed})`,
    );
  }

  // Step 1: execute the verified wallet transfer (enforces funds + idempotency).
  const txn = await transferFunds(
    fromUserId,
    toUserId,
    amount,
    idempotencyKey,
  );

  // Step 2: record settlement and update balances in a single transaction.
  return db.transaction(async (tx) => {
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
