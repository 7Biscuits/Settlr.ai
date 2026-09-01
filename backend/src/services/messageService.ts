import { db } from "../database/client.js";
import {
  conversations,
  type Conversation,
} from "../database/schema/conversations.js";
import {
  directMessages,
  type DirectMessage,
} from "../database/schema/directMessages.js";
import { users } from "../database/schema/users.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { realtimeHub } from "./realtimeHub.js";
import { lookupUserByContact } from "./userService.js";
import type {
  CreateConversationInput,
  SendMessageInput,
  QuickSendMessageInput,
  ListMessagesQuery,
} from "../schemas/messageSchemas.js";

export interface OtherParticipant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
}

export interface ConversationSummary extends Conversation {
  otherParticipant: OtherParticipant;
  unreadCount: number;
}

export interface ConversationDetail {
  conversation: Conversation;
  otherParticipant: OtherParticipant;
}

/**
 * Resolves a recipient's user ID from UUID, phone number, or email.
 */
async function resolveRecipientId(input: {
  recipientId?: string;
  phone?: string;
  email?: string;
}): Promise<string> {
  if (input.recipientId) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, input.recipientId));
    if (!user) {
      throw new NotFoundError("Recipient user not found");
    }
    return user.id;
  }

  const found = await lookupUserByContact({
    phone: input.phone,
    email: input.email,
  });

  if (!found) {
    throw new NotFoundError("No registered user found with that contact");
  }
  return found.id;
}

/**
 * Ensures canonical ordering of user IDs (user1 < user2).
 */
function canonicalPair(userA: string, userB: string): [string, string] {
  if (userA === userB) {
    throw new ValidationError("Cannot start a conversation with yourself");
  }
  return userA < userB ? [userA, userB] : [userB, userA];
}

/**
 * Gets or creates a canonical 1-on-1 direct conversation thread between two users.
 */
export async function getOrCreateDirectConversation(
  userA: string,
  userB: string,
): Promise<Conversation> {
  const [user1Id, user2Id] = canonicalPair(userA, userB);

  // Assert both users exist
  const existingUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.id, user1Id), eq(users.id, user2Id)));

  if (existingUsers.length < 2) {
    throw new NotFoundError("One or both users do not exist");
  }

  const [existingConv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.user1Id, user1Id),
        eq(conversations.user2Id, user2Id),
      ),
    );

  if (existingConv) {
    return existingConv;
  }

  const [newConv] = await db
    .insert(conversations)
    .values({
      user1Id,
      user2Id,
      lastMessagePreview: "Started conversation",
    })
    .onConflictDoNothing()
    .returning();

  if (newConv) {
    return newConv;
  }

  // If conflict occurred from concurrent insert, fetch the newly created thread
  const [createdConv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.user1Id, user1Id),
        eq(conversations.user2Id, user2Id),
      ),
    );

  if (!createdConv) {
    throw new Error("Failed to retrieve or create conversation thread");
  }

  return createdConv;
}


/**
 * Creates or fetches a conversation from user contact or ID.
 */
export async function initiateConversation(
  userId: string,
  input: CreateConversationInput,
): Promise<ConversationDetail> {
  const recipientId = await resolveRecipientId(input);
  const conversation = await getOrCreateDirectConversation(userId, recipientId);
  return getConversation(conversation.id, userId);
}

/**
 * Lists all conversations for a user with unread counts and partner info.
 */
export async function listConversations(
  userId: string,
): Promise<ConversationSummary[]> {
  const userConvs = await db
    .select()
    .from(conversations)
    .where(
      or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId)),
    )
    .orderBy(desc(conversations.lastMessageAt));

  if (userConvs.length === 0) {
    return [];
  }

  const results: ConversationSummary[] = [];

  for (const conv of userConvs) {
    const partnerId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;

    const [partner] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, partnerId));

    const [unread] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(directMessages)
      .where(
        and(
          eq(directMessages.conversationId, conv.id),
          eq(directMessages.recipientId, userId),
          eq(directMessages.isRead, false),
        ),
      );

    if (partner) {
      results.push({
        ...conv,
        otherParticipant: partner,
        unreadCount: unread?.count ?? 0,
      });
    }
  }

  return results;
}

/**
 * Gets conversation detail by ID, ensuring requester is a participant.
 */
export async function getConversation(
  conversationId: string,
  userId: string,
): Promise<ConversationDetail> {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!conv) {
    throw new NotFoundError("Conversation not found");
  }

  if (conv.user1Id !== userId && conv.user2Id !== userId) {
    throw new ForbiddenError("You are not a participant in this conversation");
  }

  const partnerId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;

  const [partner] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, partnerId));

  if (!partner) {
    throw new NotFoundError("Partner user not found");
  }

  return {
    conversation: conv,
    otherParticipant: partner,
  };
}

/**
 * Sends a message into a conversation thread and dispatches real-time events.
 */
export async function sendMessage(
  senderId: string,
  conversationId: string,
  input: SendMessageInput,
): Promise<DirectMessage> {
  const { conversation, otherParticipant } = await getConversation(
    conversationId,
    senderId,
  );
  const recipientId = otherParticipant.id;

  const [message] = await db
    .insert(directMessages)
    .values({
      conversationId: conversation.id,
      senderId,
      recipientId,
      content: input.content,
      messageType: input.messageType ?? "text",
      attachmentUrl: input.attachmentUrl,
      metadata: input.metadata,
      isRead: false,
    })
    .returning();

  // Update conversation lastMessageAt and preview
  await db
    .update(conversations)
    .set({
      lastMessagePreview: input.content.slice(0, 255),
      lastMessageAt: new Date(),
    })
    .where(eq(conversations.id, conversation.id));

  // Push real-time event to recipient
  realtimeHub.sendToUser(recipientId, {
    type: "new_message",
    conversationId: conversation.id,
    data: message as unknown as Record<string, unknown>,
    timestamp: message!.createdAt.toISOString(),
  });

  return message!;
}

/**
 * Sends a quick message by recipient contact/id, auto-creating thread if needed.
 */
export async function quickSendMessage(
  senderId: string,
  input: QuickSendMessageInput,
): Promise<{ conversationId: string; message: DirectMessage }> {
  const recipientId = await resolveRecipientId({
    recipientId: input.recipientId,
    phone: input.phone,
    email: input.email,
  });

  const conv = await getOrCreateDirectConversation(senderId, recipientId);
  const message = await sendMessage(senderId, conv.id, {
    content: input.content,
    messageType: input.messageType,
    attachmentUrl: input.attachmentUrl,
    metadata: input.metadata,
  });

  return { conversationId: conv.id, message };
}

/**
 * Lists paginated messages for a conversation.
 */
export async function listMessages(
  conversationId: string,
  userId: string,
  query: ListMessagesQuery,
): Promise<DirectMessage[]> {
  await getConversation(conversationId, userId);

  const limit = query.limit ?? 50;

  if (query.before) {
    const beforeDate = new Date(query.before);
    if (!isNaN(beforeDate.getTime())) {
      return db
        .select()
        .from(directMessages)
        .where(
          and(
            eq(directMessages.conversationId, conversationId),
            lt(directMessages.createdAt, beforeDate),
          ),
        )
        .orderBy(desc(directMessages.createdAt))
        .limit(limit);
    }
  }

  return db
    .select()
    .from(directMessages)
    .where(eq(directMessages.conversationId, conversationId))
    .orderBy(desc(directMessages.createdAt))
    .limit(limit);
}

/**
 * Marks unread messages in a conversation as read.
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
): Promise<{ markedCount: number }> {
  const { otherParticipant } = await getConversation(conversationId, userId);

  const updated = await db
    .update(directMessages)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(directMessages.conversationId, conversationId),
        eq(directMessages.recipientId, userId),
        eq(directMessages.isRead, false),
      ),
    )
    .returning();

  if (updated.length > 0) {
    realtimeHub.sendToUser(otherParticipant.id, {
      type: "messages_read",
      conversationId,
      data: { readBy: userId, count: updated.length },
      timestamp: new Date().toISOString(),
    });
  }

  return { markedCount: updated.length };
}

/**
 * Returns total unread messages count for a user across all conversations.
 */
export async function getUnreadCount(
  userId: string,
): Promise<{ unreadCount: number }> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(directMessages)
    .where(
      and(
        eq(directMessages.recipientId, userId),
        eq(directMessages.isRead, false),
      ),
    );

  return { unreadCount: result?.count ?? 0 };
}
