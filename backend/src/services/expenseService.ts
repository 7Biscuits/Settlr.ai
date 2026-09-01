import { db } from "../database/client.js";
import { expenses, type Expense } from "../database/schema/expenses.js";
import { expenseSplits } from "../database/schema/expenseSplits.js";
import { assertMember } from "./groupService.js";
import { applyExpenseToBalances } from "./balanceService.js";
import { splitEqual, validateCustomSplit } from "./splitCalculator.js";
import { ValidationError } from "../utils/errors.js";
import { eq } from "drizzle-orm";
import type { CreateExpenseInput } from "../schemas/expenseSchemas.js";

export interface ExpenseWithSplits extends Expense {
  splits: { userId: string; amountOwed: number }[];
}

export async function createExpense(
  groupId: string,
  requesterId: string,
  input: CreateExpenseInput,
): Promise<ExpenseWithSplits> {
  await assertMember(groupId, requesterId);
  await assertMember(groupId, input.paidBy);

  const participantIds = input.participants.map((p) => p.userId);
  // All participants must be group members.
  for (const pid of participantIds) {
    await assertMember(groupId, pid);
  }

  let owedAmounts: number[];
  if (input.splitType === "equal") {
    owedAmounts = splitEqual(input.amount, participantIds.length);
  } else {
    const custom = input.participants.map((p) => p.amount as number);
    owedAmounts = validateCustomSplit(input.amount, custom);
  }

  if (!participantIds.includes(input.paidBy)) {
    throw new ValidationError("The payer must be one of the participants");
  }

  return db.transaction(async (tx) => {
    const [expense] = await tx
      .insert(expenses)
      .values({
        groupId,
        paidBy: input.paidBy,
        description: input.description,
        amount: input.amount,
        splitType: input.splitType,
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

    return {
      ...expense!,
      splits: splitRows.map((s) => ({
        userId: s.userId,
        amountOwed: s.amountOwed,
      })),
    };
  });
}

export async function listExpenses(
  groupId: string,
  requesterId: string,
): Promise<Expense[]> {
  await assertMember(groupId, requesterId);
  return db.select().from(expenses).where(eq(expenses.groupId, groupId));
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
    throw new ValidationError("Expense not found");
  }
  await assertMember(expense.groupId, requesterId);
  const splits = await db
    .select({
      userId: expenseSplits.userId,
      amountOwed: expenseSplits.amountOwed,
    })
    .from(expenseSplits)
    .where(eq(expenseSplits.expenseId, expenseId));
  return { ...expense, splits };
}
