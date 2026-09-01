ALTER TABLE "agent_action_proposals" ADD COLUMN "executing_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agent_action_proposals" ADD COLUMN "execution_token" varchar(64);