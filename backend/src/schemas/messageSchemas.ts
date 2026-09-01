import { z } from "zod";

export const MESSAGE_TYPES = [
  "text",
  "payment_request",
  "expense_share",
  "transfer_receipt",
  "image",
] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number];

export const createConversationSchema = z
  .object({
    recipientId: z.string().uuid().optional(),
    phone: z.string().min(3).max(32).optional(),
    email: z.string().email().optional(),
  })
  .refine(
    (data) => Boolean(data.recipientId || data.phone || data.email),
    { message: "Either recipientId, phone, or email must be provided to start a conversation" },
  );

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  messageType: z.enum(MESSAGE_TYPES).default("text"),
  attachmentUrl: z.string().url().max(1024).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const quickSendMessageSchema = z
  .object({
    recipientId: z.string().uuid().optional(),
    phone: z.string().min(3).max(32).optional(),
    email: z.string().email().optional(),
    content: z.string().trim().min(1).max(2000),
    messageType: z.enum(MESSAGE_TYPES).default("text"),
    attachmentUrl: z.string().url().max(1024).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => Boolean(data.recipientId || data.phone || data.email),
    { message: "Either recipientId, phone, or email must be provided to send a message" },
  );

export const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().optional(),
});

export const conversationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type QuickSendMessageInput = z.infer<typeof quickSendMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
