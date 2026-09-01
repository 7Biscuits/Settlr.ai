import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { groups } from "./groups.js";

/**
 * Monetary amounts are stored as integer minor units (e.g. 1 unit = 1/100)
 * to avoid floating-point rounding errors in financial calculations.
 */
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  paidBy: uuid("paid_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  description: varchar("description", { length: 255 }).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  splitType: varchar("split_type", { length: 20 }).notNull().default("equal"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
