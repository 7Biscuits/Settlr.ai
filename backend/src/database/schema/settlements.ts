import {
  pgTable,
  uuid,
  bigint,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { groups } from "./groups.js";
import { transactions } from "./transactions.js";

/**
 * Records a debt settlement between two users, linked to the wallet
 * transaction that executed it.
 */
export const settlements = pgTable("settlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  fromUserId: uuid("from_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  toUserId: uuid("to_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  amount: bigint("amount", { mode: "number" }).notNull(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;
