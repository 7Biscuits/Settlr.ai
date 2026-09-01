import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import {
  createConversationSchema,
  sendMessageSchema,
  quickSendMessageSchema,
  listMessagesQuerySchema,
  conversationIdParamSchema,
} from "../schemas/messageSchemas.js";
import {
  initiateConversation,
  listConversations,
  getConversation,
  sendMessage,
  quickSendMessage,
  listMessages,
  markMessagesAsRead,
  getUnreadCount,
} from "../services/messageService.js";
import { realtimeHub } from "../services/realtimeHub.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const messageRateLimit = createRateLimiter({ max: 60, windowMs: 60_000 });

export async function messageRoutes(app: FastifyInstance): Promise<void> {

  app.addHook("preHandler", authenticate);

  /**
   * List all direct message conversations for the authenticated user.
   */
  app.get("/conversations", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const conversations = await listConversations(userId);
    return reply.send({ conversations });
  });

  /**
   * Start or fetch a 1-on-1 direct conversation with a recipient.
   */
  app.post("/conversations", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const input = createConversationSchema.parse(request.body);
    const detail = await initiateConversation(userId, input);
    return reply.code(201).send(detail);
  });

  /**
   * Get single conversation details.
   */
  app.get("/conversations/:id", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = conversationIdParamSchema.parse(request.params);
    const detail = await getConversation(id, userId);
    return reply.send(detail);
  });

  /**
   * List paginated messages in a conversation.
   */
  app.get("/conversations/:id/messages", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = conversationIdParamSchema.parse(request.params);
    const query = listMessagesQuerySchema.parse(request.query);
    const messages = await listMessages(id, userId, query);
    return reply.send({ messages });
  });

  /**
   * Post a message into a conversation.
   */
  app.post("/conversations/:id/messages", { preHandler: messageRateLimit }, async (request, reply) => {

    const { id: userId } = request.user as { id: string };
    const { id } = conversationIdParamSchema.parse(request.params);
    const input = sendMessageSchema.parse(request.body);
    const message = await sendMessage(userId, id, input);
    return reply.code(201).send({ message });
  });

  /**
   * Quick-send a message directly to a user (auto-creating the conversation if needed).
   */
  app.post("/messages", { preHandler: messageRateLimit }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const input = quickSendMessageSchema.parse(request.body);
    const result = await quickSendMessage(userId, input);
    return reply.code(201).send(result);
  });


  /**
   * Mark all unread messages in a conversation as read.
   */
  app.post("/conversations/:id/read", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = conversationIdParamSchema.parse(request.params);
    const result = await markMessagesAsRead(id, userId);
    return reply.send(result);
  });

  /**
   * Get total unread direct messages count for the user.
   */
  app.get("/messages/unread-count", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const result = await getUnreadCount(userId);
    return reply.send(result);
  });

  /**
   * Real-time Server-Sent Events (SSE) stream for instant message and read notifications.
   */
  app.get("/messages/events", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    reply.raw.write("retry: 5000\n\n");

    const heartbeatInterval = setInterval(() => {
      try {
        reply.raw.write(": keepalive\n\n");
      } catch {
        clearInterval(heartbeatInterval);
      }
    }, 15000);

    const unsubscribe = realtimeHub.subscribe(userId, (event) => {
      try {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch {
        // Ignored on disconnected client
      }
    });

    request.raw.on("close", () => {
      clearInterval(heartbeatInterval);
      unsubscribe();
    });
  });
}

