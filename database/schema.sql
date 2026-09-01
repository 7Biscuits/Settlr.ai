-- =========================================================
-- PayPilot Complete Database Schema (PostgreSQL / Supabase)
-- =========================================================

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar(255) NOT NULL,
    "name" varchar(120) NOT NULL,
    "password_hash" varchar(255) NOT NULL,
    "phone" varchar(32),
    "avatar_url" varchar(512),
    "bio" varchar(255),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "users_email_unique" UNIQUE("email"),
    CONSTRAINT "users_phone_unique" UNIQUE("phone")
);

-- 2. Groups Table
CREATE TABLE IF NOT EXISTS "groups" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(120) NOT NULL,
    "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE restrict,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Group Members Table
CREATE TABLE IF NOT EXISTS "group_members" (
    "group_id" uuid NOT NULL REFERENCES "groups"("id") ON DELETE cascade,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "role" varchar(20) DEFAULT 'member' NOT NULL,
    "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "group_members_group_id_user_id_pk" PRIMARY KEY("group_id", "user_id")
);

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS "expenses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "group_id" uuid NOT NULL REFERENCES "groups"("id") ON DELETE cascade,
    "paid_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE restrict,
    "description" varchar(255) NOT NULL,
    "amount" bigint NOT NULL,
    "split_type" varchar(20) DEFAULT 'equal' NOT NULL,
    "category" varchar(50) DEFAULT 'general' NOT NULL,
    "receipt_url" varchar(1024),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 5. Expense Splits Table
CREATE TABLE IF NOT EXISTS "expense_splits" (
    "expense_id" uuid NOT NULL REFERENCES "expenses"("id") ON DELETE cascade,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE restrict,
    "amount_owed" bigint NOT NULL,
    CONSTRAINT "expense_splits_expense_id_user_id_pk" PRIMARY KEY("expense_id", "user_id")
);

-- 6. Balances Ledger Table (Pairwise Debt within Groups)
CREATE TABLE IF NOT EXISTS "balances" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "group_id" uuid NOT NULL REFERENCES "groups"("id") ON DELETE cascade,
    "creditor_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "debtor_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "amount" bigint DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "balances_group_id_creditor_id_debtor_id_unique" UNIQUE("group_id", "creditor_id", "debtor_id")
);

-- 7. Wallets Table
CREATE TABLE IF NOT EXISTS "wallets" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "balance" bigint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);

-- 8. Transactions Table
CREATE TABLE IF NOT EXISTS "transactions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "type" varchar(20) NOT NULL,
    "from_user_id" uuid REFERENCES "users"("id") ON DELETE restrict,
    "to_user_id" uuid REFERENCES "users"("id") ON DELETE restrict,
    "amount" bigint NOT NULL,
    "status" varchar(20) DEFAULT 'completed' NOT NULL,
    "idempotency_key" varchar(128) NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);

-- 9. Settlements Table
CREATE TABLE IF NOT EXISTS "settlements" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "group_id" uuid NOT NULL REFERENCES "groups"("id") ON DELETE cascade,
    "from_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE restrict,
    "to_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE restrict,
    "amount" bigint NOT NULL,
    "transaction_id" uuid NOT NULL REFERENCES "transactions"("id") ON DELETE restrict,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 10. Group Invitations Table
CREATE TABLE IF NOT EXISTS "group_invitations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "group_id" uuid NOT NULL REFERENCES "groups"("id") ON DELETE cascade,
    "invited_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE restrict,
    "email" varchar(255) NOT NULL,
    "token" varchar(128) NOT NULL,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "group_invitations_token_unique" UNIQUE("token")
);

-- 11. AI Action Proposals Table
CREATE TABLE IF NOT EXISTS "agent_action_proposals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "tool_name" varchar(120) NOT NULL,
    "tool_arguments" jsonb NOT NULL,
    "tool_call_id" varchar(128) NOT NULL,
    "messages" jsonb NOT NULL,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "result" jsonb,
    "executing_at" timestamp with time zone,
    "execution_token" varchar(64),
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 12. Revoked Tokens Table (Logout & Invalidation)
CREATE TABLE IF NOT EXISTS "revoked_tokens" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "token_hash" varchar(64) NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "revoked_tokens_token_hash_unique" UNIQUE("token_hash")
);

-- 13. Direct Message Conversations Table
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user1_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "user2_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "last_message_preview" varchar(255),
    "last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "conversations_user1_user2_idx" ON "conversations" USING btree ("user1_id", "user2_id");

-- 14. Direct Messages Table
CREATE TABLE IF NOT EXISTS "direct_messages" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE cascade,
    "sender_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "recipient_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "content" varchar(2000) NOT NULL,
    "message_type" varchar(30) DEFAULT 'text' NOT NULL,
    "attachment_url" varchar(1024),
    "metadata" jsonb,
    "is_read" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "direct_messages_conversation_created_idx" ON "direct_messages" USING btree ("conversation_id", "created_at");
CREATE INDEX IF NOT EXISTS "direct_messages_recipient_read_idx" ON "direct_messages" USING btree ("recipient_id", "is_read");
