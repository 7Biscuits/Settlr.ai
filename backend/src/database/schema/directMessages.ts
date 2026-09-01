import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { conversations } from "./conversations.js";

/**
 * Direct messages exchanged within a conversation thread.
 * Supports text, payment requests, expense references, transfer receipts, and image attachments.
 */
export const directMessages = pgTable(
  "direct_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: varchar("content", { length: 2000 }).notNull(),
    messageType: varchar("message_type", { length: 30 })
      .notNull()
      .default("text"),
    attachmentUrl: varchar("attachment_url", { length: 1024 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    conversationCreatedIdx: index("direct_messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    recipientReadIdx: index("direct_messages_recipient_read_idx").on(
      table.recipientId,
      table.isRead,
    ),
  }),
);

export type DirectMessage = typeof directMessages.$inferSelect;
export type NewDirectMessage = typeof directMessages.$inferInsert;
