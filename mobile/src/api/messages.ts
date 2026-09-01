import { apiFetch } from "./client";
import type {
  ConversationSummary,
  ConversationDetail,
  DirectMessage,
  MessageType,
  UnreadCountResponse,
} from "./types";

export interface InitiateConversationInput {
  recipientId?: string;
  phone?: string;
  email?: string;
}

export interface SendMessageInput {
  content: string;
  messageType?: MessageType;
  attachmentUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface QuickSendMessageInput extends SendMessageInput {
  recipientId?: string;
  phone?: string;
  email?: string;
}

export interface ListMessagesQuery {
  limit?: number;
  before?: string;
}

export function listConversations(): Promise<{
  conversations: ConversationSummary[];
}> {
  return apiFetch<{ conversations: ConversationSummary[] }>("/conversations");
}

export function initiateConversation(
  input: InitiateConversationInput,
): Promise<ConversationDetail> {
  return apiFetch<ConversationDetail>("/conversations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getConversation(id: string): Promise<ConversationDetail> {
  return apiFetch<ConversationDetail>(`/conversations/${id}`);
}

export function listMessages(
  conversationId: string,
  query?: ListMessagesQuery,
): Promise<{ messages: DirectMessage[] }> {
  const params = new URLSearchParams();
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.before) params.set("before", query.before);
  const qs = params.toString();
  return apiFetch<{ messages: DirectMessage[] }>(
    `/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`,
  );
}

export function sendMessage(
  conversationId: string,
  input: SendMessageInput,
): Promise<{ message: DirectMessage }> {
  return apiFetch<{ message: DirectMessage }>(
    `/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function quickSendMessage(
  input: QuickSendMessageInput,
): Promise<{ conversationId: string; message: DirectMessage }> {
  return apiFetch<{ conversationId: string; message: DirectMessage }>(
    "/messages",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function markMessagesAsRead(
  conversationId: string,
): Promise<{ markedCount: number }> {
  return apiFetch<{ markedCount: number }>(
    `/conversations/${conversationId}/read`,
    {
      method: "POST",
    },
  );
}

export function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiFetch<UnreadCountResponse>("/messages/unread-count");
}
