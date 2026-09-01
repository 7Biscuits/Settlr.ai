import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { agent } from "../agent/agent/agent.js";
import type { ChatMessage } from "../services/deepseekClient.js";

const chatSchema = z.object({
  message: z.string().min(1),
  messages: z.array(z.any()).optional(),
});

const confirmSchema = z.object({
  tool: z.string().min(1),
  arguments: z.any(),
  toolCallId: z.string().min(1),
  messages: z.array(z.any()),
});

export async function agentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.post("/agent/chat", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { message, messages } = chatSchema.parse(request.body);
    const result = await agent.chat(
      { userId },
      message,
      messages as ChatMessage[] | undefined,
    );
    return reply.send(result);
  });

  app.post("/agent/confirm", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { tool, arguments: args, toolCallId, messages } =
      confirmSchema.parse(request.body);
    const result = await agent.confirm(
      { userId },
      tool,
      args,
      toolCallId,
      messages as ChatMessage[],
    );
    return reply.send(result);
  });
}
