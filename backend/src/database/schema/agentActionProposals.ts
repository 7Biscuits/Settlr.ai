import {
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Server-owned record of a sensitive AI action awaiting confirmation. The
 * client receives only the proposal id; the tool, arguments and tool-call
 * context are never accepted back from the client at execution time.
 */
export const agentActionProposals = pgTable("agent_action_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  toolName: varchar("tool_name", { length: 120 }).notNull(),
  toolArguments: jsonb("tool_arguments").$type<unknown>().notNull(),
  toolCallId: varchar("tool_call_id", { length: 128 }).notNull(),
  messages: jsonb("messages").$type<unknown[]>().notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  result: jsonb("result").$type<unknown>(),
  executingAt: timestamp("executing_at", { withTimezone: true }),
  executionToken: varchar("execution_token", { length: 64 }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});


export type AgentActionProposal = typeof agentActionProposals.$inferSelect;
