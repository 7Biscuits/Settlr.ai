import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { agent } from "../agent/agent/agent.js";
import type { ChatMessage } from "../services/deepseekClient.js";
import { env } from "../config/env.js";
import {
  claimActionProposal,
  completeActionProposal,
  createActionProposal,
} from "../services/agentProposalService.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

/**
 * Accepts the full conversation history (system, user, assistant, tool messages)
 * so the agent can maintain context across turns and chain multi-step tool calls.
 * Previously this only accepted role:"user" which silently dropped all context.
 */
const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.union([z.string(), z.null()]).optional(),
  tool_calls: z.array(z.any()).optional(),
  tool_call_id: z.string().optional(),
  name: z.string().optional(),
});

const chatSchema = z.object({
  message: z.string().trim().min(1).max(4_000),
  messages: z.array(chatMessageSchema).max(60).optional(),
});

const confirmSchema = z.object({
  proposalId: z.string().uuid(),
});

const agentRateLimit = createRateLimiter({ max: 20, windowMs: 60_000 });

export async function agentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.post("/agent/chat", { preHandler: agentRateLimit }, async (request, reply) => {
    if (!env.DEEPSEEK_API_KEY) {
      return reply.code(503).send({
        error: "Agent not configured",
        message: "DEEPSEEK_API_KEY is not set",
      });
    }
    const { id: userId } = request.user as { id: string };
    const { message, messages } = chatSchema.parse(request.body);

    try {
      const result = await agent.chat(
        { userId },
        message,
        messages as ChatMessage[] | undefined,
      );
      if (result.type === "confirmation_required" && result.pendingAction) {
        const proposal = await createActionProposal({
          userId,
          toolName: result.pendingAction.tool,
          toolArguments: result.pendingAction.arguments,
          toolCallId: result.pendingAction.toolCallId,
          messages: result.messages,
        });
        return reply.send({
          ...result,
          pendingAction: {
            proposalId: proposal.id,
            tool: result.pendingAction.tool,
            arguments: result.pendingAction.arguments,
          },
        });
      }
      return reply.send(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "AI service error";
      request.log.error(err, "Agent chat error");
      return reply.code(502).send({
        error: "AI Service Error",
        message: errorMsg,
      });
    }
  });

  app.post("/agent/confirm", { preHandler: agentRateLimit }, async (request, reply) => {
    if (!env.DEEPSEEK_API_KEY) {
      return reply.code(503).send({
        error: "Agent not configured",
        message: "DEEPSEEK_API_KEY is not set",
      });
    }
    const { id: userId } = request.user as { id: string };
    const { proposalId } = confirmSchema.parse(request.body);

    try {
      const claimed = await claimActionProposal(proposalId, userId);
      if (claimed.kind === "completed") {
        return reply.send(claimed.result);
      }
      const result = await agent.confirm(
        { userId },
        claimed.proposal.toolName,
        claimed.proposal.toolArguments,
        claimed.proposal.toolCallId,
        claimed.proposal.messages as ChatMessage[],
      );
      await completeActionProposal(
        proposalId,
        userId,
        claimed.executionToken,
        result,
      );
      return reply.send(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "AI confirmation error";
      request.log.error(err, "Agent confirmation error");
      return reply.code(502).send({
        error: "AI Service Error",
        message: errorMsg,
      });
    }
  });

}

