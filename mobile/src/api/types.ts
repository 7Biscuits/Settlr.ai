/**
 * Shared API types mirroring the backend response shapes. These are read-only
 * DTOs — the backend is the source of truth for all values, including balances,
 * splits, and wallet amounts (all in integer minor units of the demo currency).
 */

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Group {
  id: string;
  name: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role?: "owner" | "member" | string;
}

export interface GroupDetail {
  group: Group;
  members: GroupMember[];
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  email: string;
  status: "pending" | "accepted" | "cancelled" | "expired" | string;
  expiresAt: string;
  inviteUrl: string;
}

export type InviteOrAddResult =
  | { kind: "member_added"; member: GroupMember }
  | {
      kind: "invitation_created" | "invitation_existing";
      invitation: GroupInvitation;
    };

export const EXPENSE_CATEGORIES = [
  "general",
  "food",
  "transport",
  "housing",
  "utilities",
  "entertainment",
  "shopping",
  "travel",
  "health",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type SplitType = "equal" | "custom" | "percentage" | "shares";

export interface ExpenseSplit {
  userId: string;
  amountOwed: number;
  percentage?: number | null;
  shares?: number | null;
}

export interface Expense {
  id: string;
  groupId: string;
  paidBy: string;
  description: string;
  amount: number;
  splitType: SplitType;
  category?: string;
  receiptUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseWithSplits extends Expense {
  splits: ExpenseSplit[];
}

export interface DirectedBalance {
  otherUserId: string;
  otherUserName: string;
  // Positive => the current user is owed. Negative => the current user owes.
  netAmount: number;
}

export interface Transaction {
  id: string;
  type: "topup" | "transfer" | "settlement" | string;
  fromUserId: string | null;
  toUserId: string | null;
  amount: number;
  status: "pending" | "completed" | "failed" | string;
  createdAt: string;
}

export interface DashboardSummary {
  totalOwed: number;
  totalOwing: number;
  walletBalance: number;
  balances: DirectedBalance[];
  groups: Group[];
  recentActivity: Transaction[];
}

export interface PendingAction {
  proposalId: string;
  tool: string;
  arguments: unknown;
}

export interface AgentReply {
  type: "message" | "confirmation_required";
  content: string;
  pendingAction?: PendingAction;
  messages: unknown[];
}

// Direct Messaging Types
export const MESSAGE_TYPES = [
  "text",
  "payment_request",
  "expense_share",
  "transfer_receipt",
  "image",
] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number];

export interface OtherParticipant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
}

export interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary extends Conversation {
  otherParticipant: OtherParticipant;
  unreadCount: number;
}

export interface ConversationDetail {
  conversation: Conversation;
  otherParticipant: OtherParticipant;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType: MessageType;
  attachmentUrl: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface RealtimeMessageEvent {
  type: "new_message" | "messages_read";
  conversationId: string;
  data: DirectMessage | { readBy: string; count: number };
  timestamp: string;
}

// User Lookup & Contact Discovery Types
export interface ContactMatchUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ContactsLookupResult {
  matched: ContactMatchUser[];
  unmatchedPhones: string[];
  unmatchedEmails: string[];
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface SingleLookupInput {
  phone?: string;
  email?: string;
  query?: string;
}

export interface ContactsLookupInput {
  phones?: string[];
  emails?: string[];
}

export interface UploadReceiptResult {
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

// Health Check
export interface HealthStatus {
  status: "ok" | "degraded" | string;
  database: "connected" | "disconnected" | string;
  timestamp: string;
}
