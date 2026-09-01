import {
  pgTable,
  uuid,
  bigint,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { expenses } from "./expenses.js";

/**
 * One row per participant in an expense. `amountOwed` is the participant's
 * share in integer minor units. The sum of all splits for an expense must
 * equal the expense amount (enforced in the service layer).
 */
export const expenseSplits = pgTable(
  "expense_splits",
  {
    expenseId: uuid("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    amountOwed: bigint("amount_owed", { mode: "number" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.expenseId, t.userId] }),
  }),
);

export type ExpenseSplit = typeof expenseSplits.$inferSelect;
export type NewExpenseSplit = typeof expenseSplits.$inferInsert;
