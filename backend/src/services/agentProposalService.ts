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
import { randomUUID } from "node:crypto";

export async function claimActionProposal(
  proposalId: string,
  userId: string,
): Promise<
  | { kind: "claimed"; proposal: StoredActionProposal; executionToken: string }
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
    if (proposal.expiresAt <= new Date() || proposal.status === "expired") {
      await tx
        .update(agentActionProposals)
        .set({ status: "expired" })
        .where(eq(agentActionProposals.id, proposal.id));
      throw new ConflictError("This action proposal has expired. Please ask again.");
    }
    if (proposal.status === "cancelled") {
      throw new ConflictError("This action proposal was cancelled.");
    }

    // Concurrency lease check based on executingAt
    if (proposal.status === "executing" && proposal.executingAt) {
      const leaseAgeMs = Date.now() - new Date(proposal.executingAt).getTime();
      if (leaseAgeMs < 60_000) {
        throw new ConflictError("This action proposal is currently being processed. Please wait.");
      }
    }

    const executionToken = randomUUID();
    await tx
      .update(agentActionProposals)
      .set({
        status: "executing",
        executingAt: new Date(),
        executionToken,
      })
      .where(eq(agentActionProposals.id, proposal.id));

    return {
      kind: "claimed",
      proposal: toStoredProposal(proposal),
      executionToken,
    };
  });
}

export async function completeActionProposal(
  proposalId: string,
  userId: string,
  executionToken: string,
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
        eq(agentActionProposals.executionToken, executionToken),
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
