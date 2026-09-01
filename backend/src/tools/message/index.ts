import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import {
  listConversations,
  getOrCreateDirectConversation,
  listMessages,
  quickSendMessage,
} from "../../services/messageService.js";

export const listConversationsTool: ToolDefinition = {
  name: "list_conversations",
  description:
    "List all active direct message conversation threads with other users, along with unread counts and last message previews.",
  inputSchema: z.object({}),
  sensitive: false,
  async execute(_input, ctx) {
    const convs = await listConversations(ctx.userId);
    return { success: true, data: { conversations: convs } };
  },
};

export const getDirectMessagesTool: ToolDefinition = {
  name: "get_direct_messages",
  description:
    "Fetch recent direct messages from a conversation or with a specific user.",
  inputSchema: z
    .object({
      conversationId: z.string().uuid().optional(),
      recipientId: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    })
    .refine((data) => Boolean(data.conversationId || data.recipientId), {
      message: "Either conversationId or recipientId must be provided",
    }),
  sensitive: false,
  async execute(input, ctx) {
    const { conversationId, recipientId, limit } = input as {
      conversationId?: string;
      recipientId?: string;
      limit: number;
    };

    let convId = conversationId;
    if (!convId && recipientId) {
      const conv = await getOrCreateDirectConversation(ctx.userId, recipientId);
      convId = conv.id;
    }

    const messages = await listMessages(convId!, ctx.userId, { limit });
    return { success: true, data: { messages } };
  },
};

export const sendDirectMessageTool: ToolDefinition = {
  name: "send_direct_message",
  description:
    "Send a direct message, payment reminder, or payment request to a contact. Sensitive: requires confirmation.",
  inputSchema: z
    .object({
      recipientId: z.string().uuid().optional(),
      phone: z.string().min(3).max(32).optional(),
      email: z.string().email().optional(),
      content: z.string().min(1).max(2000),
      messageType: z
        .enum([
          "text",
          "payment_request",
          "expense_share",
          "transfer_receipt",
          "image",
        ])
        .default("text"),
    })
    .refine((data) => Boolean(data.recipientId || data.phone || data.email), {
      message: "Either recipientId, phone, or email must be provided to send a message",
    }),
  sensitive: true,
  async execute(input, ctx) {
    const { recipientId, phone, email, content, messageType } = input as {
      recipientId?: string;
      phone?: string;
      email?: string;
      content: string;
      messageType: "text" | "payment_request" | "expense_share" | "transfer_receipt" | "image";
    };

    const result = await quickSendMessage(ctx.userId, {
      recipientId,
      phone,
      email,
      content,
      messageType,
    });

    return { success: true, data: result };
  },
};
