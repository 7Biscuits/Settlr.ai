import {
  pgTable,
  uuid,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Stores SHA-256 hashes of revoked JWT tokens. Tokens are automatically
 * filtered out once expired.
 */
export const revokedTokens = pgTable("revoked_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RevokedToken = typeof revokedTokens.$inferSelect;
export type NewRevokedToken = typeof revokedTokens.$inferInsert;
