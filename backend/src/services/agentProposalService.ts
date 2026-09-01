import { and, eq } from "drizzle-orm";
import type { AgentReply } from "../agent/orchestration/orchestrator.js";
import { db } from "../database/client.js";
import {
  agentActionProposals,
  type AgentActionProposal,
} from "../database/schema/agentActionProposals.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";

const PROPOSAL_TTL_MS = 10 * 60 * 1000;

export interface StoredActionProposal {
  id: string;
  toolName: string;
  toolArguments: unknown;
  toolCallId: string;
  messages: unknown[];
}

export async function createActionProposal(input: {
  userId: string;
  toolName: string;
  toolArguments: unknown;
  toolCallId: string;
  messages: unknown[];
}): Promise<StoredActionProposal> {
  const [proposal] = await db
    .insert(agentActionProposals)
    .values({
      ...input,
      expiresAt: new Date(Date.now() + PROPOSAL_TTL_MS),
    })
    .returning();
  if (!proposal) throw new Error("Action proposal creation did not return a row");
  return toStoredProposal(proposal);
}

/**
 * Atomically claims a pending action. A completed action returns its persisted
 * response instead of executing the tool again, making confirmation retries
 * safe even after a lost client response.
 */
export async function claimActionProposal(
  proposalId: string,
  userId: string,
): Promise<
  | { kind: "claimed"; proposal: StoredActionProposal }
  | { kind: "completed"; result: AgentReply }
> {
  return db.transaction(async (tx) => {
    const [proposal] = await tx
      .select()
      .from(agentActionProposals)
      .where(eq(agentActionProposals.id, proposalId))
      .for("update");
    if (!proposal || proposal.userId !== userId) {
      throw new NotFoundError("Action proposal not found");
    }
    if (proposal.status === "completed" && proposal.result) {
      return { kind: "completed", result: proposal.result as AgentReply };
    }
    if (proposal.status !== "pending") {
      throw new ConflictError("This action proposal has already been processed");
    }
    if (proposal.expiresAt <= new Date()) {
      await tx
        .update(agentActionProposals)
        .set({ status: "expired" })
        .where(eq(agentActionProposals.id, proposal.id));
      throw new ConflictError("This action proposal has expired. Please ask again.");
    }
    await tx
      .update(agentActionProposals)
      .set({ status: "executing" })
      .where(
        and(
          eq(agentActionProposals.id, proposal.id),
          eq(agentActionProposals.status, "pending"),
        ),
      );
    return { kind: "claimed", proposal: toStoredProposal(proposal) };
  });
}

export async function completeActionProposal(
  proposalId: string,
  userId: string,
  result: AgentReply,
): Promise<void> {
  await db
    .update(agentActionProposals)
    .set({ status: "completed", confirmedAt: new Date(), result })
    .where(
      and(
        eq(agentActionProposals.id, proposalId),
        eq(agentActionProposals.userId, userId),
        eq(agentActionProposals.status, "executing"),
      ),
    );
}

function toStoredProposal(proposal: AgentActionProposal): StoredActionProposal {
  return {
    id: proposal.id,
    toolName: proposal.toolName,
    toolArguments: proposal.toolArguments,
    toolCallId: proposal.toolCallId,
    messages: proposal.messages,
  };
}
