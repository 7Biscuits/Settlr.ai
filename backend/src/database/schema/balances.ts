import {
  pgTable,
  uuid,
  bigint,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { groups } from "./groups.js";

/**
 * Net balance ledger between two users within a group.
 * A positive `amount` means `creditorId` is owed that amount by `debtorId`.
 * The database is the source of truth; this table is maintained by the
 * balance/settlement services, never directly by the LLM.
 */
export const balances = pgTable(
  "balances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    creditorId: uuid("creditor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    debtorId: uuid("debtor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: bigint("amount", { mode: "number" }).notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniquePair: unique().on(t.groupId, t.creditorId, t.debtorId),
  }),
);

export type Balance = typeof balances.$inferSelect;
export type NewBalance = typeof balances.$inferInsert;
