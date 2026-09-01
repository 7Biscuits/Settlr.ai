import {
  pgTable,
  uuid,
  bigint,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Immutable financial ledger. Every wallet movement (topup, transfer,
 * settlement) is recorded here. `idempotencyKey` is unique and prevents
 * duplicate execution of the same logical operation.
 */
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  // "topup" | "transfer" | "settlement"
  type: varchar("type", { length: 20 }).notNull(),
  // Nullable for topups (external/sandbox source).
  fromUserId: uuid("from_user_id").references(() => users.id, {
    onDelete: "restrict",
  }),
  toUserId: uuid("to_user_id").references(() => users.id, {
    onDelete: "restrict",
  }),
  amount: bigint("amount", { mode: "number" }).notNull(),
  // "pending" | "completed" | "failed"
  status: varchar("status", { length: 20 }).notNull().default("completed"),
  idempotencyKey: varchar("idempotency_key", { length: 128 })
    .notNull()
    .unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
