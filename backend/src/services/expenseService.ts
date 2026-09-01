import { db } from "../database/client.js";
import { expenses, type Expense } from "../database/schema/expenses.js";
import { expenseSplits } from "../database/schema/expenseSplits.js";
import { assertMember, isGroupOwner } from "./groupService.js";
import {
  applyExpenseToBalances,
  revertExpenseFromBalances,
} from "./balanceService.js";
import {
  splitEqual,
  validateCustomSplit,
  splitPercentage,
  splitShares,
} from "./splitCalculator.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import { eq } from "drizzle-orm";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from "../schemas/expenseSchemas.js";

export interface ExpenseWithSplits extends Expense {
  splits: { userId: string; amountOwed: number }[];
}

export async function assertCanManageExpense(
  groupId: string,
  expensePaidBy: string,
  requesterId: string,
): Promise<void> {
  if (requesterId === expensePaidBy) return;
  const isOwner = await isGroupOwner(groupId, requesterId);
  if (!isOwner) {
    throw new ForbiddenError(
      "Only the expense payer or group owner can modify or delete this expense",
    );
  }
}

function calculateOwedAmounts(
  amount: number,
  splitType: "equal" | "custom" | "percentage" | "shares",
  participants: {
    userId: string;
    amount?: number;
    percentage?: number;
    shares?: number;
  }[],
): number[] {
  switch (splitType) {
    case "equal":
      return splitEqual(amount, participants.length);
    case "custom": {
      const custom = participants.map((p) => {
        if (typeof p.amount !== "number") {
          throw new ValidationError("Custom split requires an amount for every participant");
        }
        return p.amount;
      });
      return validateCustomSplit(amount, custom);
    }
    case "percentage": {
      const percentages = participants.map((p) => {
        if (typeof p.percentage !== "number") {
          throw new ValidationError("Percentage split requires a percentage for every participant");
        }
        return p.percentage;
      });
      return splitPercentage(amount, percentages);
    }
    case "shares": {
      const shares = participants.map((p) => {
        if (typeof p.shares !== "number") {
          throw new ValidationError("Shares split requires a shares weight for every participant");
        }
        return p.shares;
      });
      return splitShares(amount, shares);
    }
    default:
      throw new ValidationError(`Unsupported split type: ${splitType}`);
  }
}

import { getSignedReceiptUrl } from "./storageService.js";

export async function resolveReceiptUrl(
  pathOrUrl: string | null,
): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (!pathOrUrl.startsWith("http://") && !pathOrUrl.startsWith("https://")) {
    try {
      return await getSignedReceiptUrl(pathOrUrl, 3600);
    } catch {
      return pathOrUrl;
    }
  }
  return pathOrUrl;
}

export async function createExpense(
  groupId: string,
  requesterId: string,
  input: CreateExpenseInput,
): Promise<ExpenseWithSplits> {
  await assertMember(groupId, requesterId);
  await assertMember(groupId, input.paidBy);

  const participantIds = input.participants.map((p) => p.userId);
  for (const pid of participantIds) {
    await assertMember(groupId, pid);
  }

  const owedAmounts = calculateOwedAmounts(
    input.amount,
    input.splitType,
    input.participants,
  );

  return db.transaction(async (tx) => {
    const [expense] = await tx
      .insert(expenses)
      .values({
        groupId,
        paidBy: input.paidBy,
        description: input.description,
        amount: input.amount,
        splitType: input.splitType,
        category: input.category ?? "general",
        receiptUrl: input.receiptUrl,
      })
      .returning();

    const splitRows = participantIds.map((userId, i) => ({
      expenseId: expense!.id,
      userId,
      amountOwed: owedAmounts[i]!,
    }));
    await tx.insert(expenseSplits).values(splitRows);

    // Update the pairwise balance ledger within the same transaction.
    await applyExpenseToBalances(tx, {
      groupId,
      paidBy: input.paidBy,
      splits: splitRows.map((s) => ({
        userId: s.userId,
        amountOwed: s.amountOwed,
      })),
    });

    const signedReceiptUrl = await resolveReceiptUrl(expense!.receiptUrl);

    return {
      ...expense!,
      receiptUrl: signedReceiptUrl,
      splits: splitRows.map((s) => ({
        userId: s.userId,
        amountOwed: s.amountOwed,
      })),
    };
  });
}

export async function updateExpense(
  expenseId: string,
  requesterId: string,
  input: UpdateExpenseInput,
): Promise<ExpenseWithSplits> {
  const existing = await getExpense(expenseId, requesterId);
  const groupId = existing.groupId;

  // Enforce management authorization (payer or group owner)
  await assertCanManageExpense(groupId, existing.paidBy, requesterId);

  const description = input.description ?? existing.description;
  const category = input.category ?? existing.category;
  const receiptUrl =
    input.receiptUrl !== undefined ? input.receiptUrl : existing.receiptUrl;

  const isFinancialChange =
    (input.amount !== undefined && input.amount !== existing.amount) ||
    (input.paidBy !== undefined && input.paidBy !== existing.paidBy) ||
    (input.splitType !== undefined && input.splitType !== existing.splitType) ||
    input.participants !== undefined;

  // If only metadata changed, skip split and balance recalculation completely
  if (!isFinancialChange) {
    const [updated] = await db
      .update(expenses)
      .set({
        description,
        category,
        receiptUrl,
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    const signedReceiptUrl = await resolveReceiptUrl(updated!.receiptUrl);
    return {
      ...updated!,
      receiptUrl: signedReceiptUrl,
      splits: existing.splits,
    };
  }

  const paidBy = input.paidBy ?? existing.paidBy;
  await assertMember(groupId, paidBy);

  const amount = input.amount ?? existing.amount;
  const splitType = (input.splitType ?? existing.splitType) as
    | "equal"
    | "custom"
    | "percentage"
    | "shares";

  // Require participants when modifying financial parameters of non-equal splits
  if (!input.participants && splitType !== "equal") {
    throw new ValidationError(
      "Updating amount, payer, or split type on a percentage, shares, or custom split expense requires providing participants with updated split values",
    );
  }

  let participants = input.participants;
  if (!participants) {
    participants = existing.splits.map((s) => ({
      userId: s.userId,
      amount: splitType === "custom" ? s.amountOwed : undefined,
    }));
  }

  for (const p of participants) {
    await assertMember(groupId, p.userId);
  }

  const owedAmounts = calculateOwedAmounts(amount, splitType, participants);

  return db.transaction(async (tx) => {
    // 1. Revert previous balances
    await revertExpenseFromBalances(tx, {
      groupId,
      paidBy: existing.paidBy,
      splits: existing.splits,
    });

    // 2. Delete previous splits
    await tx
      .delete(expenseSplits)
      .where(eq(expenseSplits.expenseId, expenseId));

    // 3. Update expense row
    const [updatedExpense] = await tx
      .update(expenses)
      .set({
        description,
        amount,
        paidBy,
        splitType,
        category,
        receiptUrl,
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    // 4. Insert new splits
    const newSplitRows = participants!.map((p, i) => ({
      expenseId,
      userId: p.userId,
      amountOwed: owedAmounts[i]!,
    }));
    await tx.insert(expenseSplits).values(newSplitRows);

    // 5. Apply updated balances
    await applyExpenseToBalances(tx, {
      groupId,
      paidBy,
      splits: newSplitRows.map((s) => ({
        userId: s.userId,
        amountOwed: s.amountOwed,
      })),
    });

    const signedReceiptUrl = await resolveReceiptUrl(updatedExpense!.receiptUrl);

    return {
      ...updatedExpense!,
      receiptUrl: signedReceiptUrl,
      splits: newSplitRows.map((s) => ({
        userId: s.userId,
        amountOwed: s.amountOwed,
      })),
    };
  });
}

export async function attachReceiptToExpense(
  expenseId: string,
  requesterId: string,
  receiptUrl: string | null,
): Promise<ExpenseWithSplits> {
  const existing = await getExpense(expenseId, requesterId);
  await assertCanManageExpense(existing.groupId, existing.paidBy, requesterId);

  const [updated] = await db
    .update(expenses)
    .set({ receiptUrl })
    .where(eq(expenses.id, expenseId))
    .returning();


  if (!updated) {
    throw new NotFoundError("Expense not found");
  }

  const signedReceiptUrl = await resolveReceiptUrl(updated.receiptUrl);

  return {
    ...updated,
    receiptUrl: signedReceiptUrl,
    splits: existing.splits,
  };
}

export async function deleteExpense(
  expenseId: string,
  requesterId: string,
): Promise<void> {
  const existing = await getExpense(expenseId, requesterId);
  await assertCanManageExpense(existing.groupId, existing.paidBy, requesterId);

  await db.transaction(async (tx) => {
    // 1. Revert balances
    await revertExpenseFromBalances(tx, {
      groupId: existing.groupId,
      paidBy: existing.paidBy,
      splits: existing.splits,
    });

    // 2. Delete expense (cascades to expense_splits)
    await tx.delete(expenses).where(eq(expenses.id, expenseId));
  });
}

export async function listExpenses(
  groupId: string,
  requesterId: string,
): Promise<Expense[]> {
  await assertMember(groupId, requesterId);
  const rows = await db
    .select()
    .from(expenses)
    .where(eq(expenses.groupId, groupId));

  return Promise.all(
    rows.map(async (exp) => ({
      ...exp,
      receiptUrl: await resolveReceiptUrl(exp.receiptUrl),
    })),
  );
}

export async function getExpense(
  expenseId: string,
  requesterId: string,
): Promise<ExpenseWithSplits> {
  const [expense] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, expenseId));
  if (!expense) {
    throw new NotFoundError("Expense not found");
  }
  await assertMember(expense.groupId, requesterId);
  const splits = await db
    .select({
      userId: expenseSplits.userId,
      amountOwed: expenseSplits.amountOwed,
    })
    .from(expenseSplits)
    .where(eq(expenseSplits.expenseId, expenseId));

  const signedReceiptUrl = await resolveReceiptUrl(expense.receiptUrl);

  return { ...expense, receiptUrl: signedReceiptUrl, splits };
}
