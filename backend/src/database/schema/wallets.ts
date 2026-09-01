import {
  pgTable,
  uuid,
  bigint,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * In-app demo wallet. `balance` is in integer minor units of the demo
 * currency. One wallet per user.
 */
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: bigint("balance", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
