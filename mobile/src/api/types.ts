/**
 * Shared API types mirroring the backend response shapes. These are read-only
 * DTOs — the backend is the source of truth for all values, including balances,
 * splits, and wallet amounts (all in integer minor units of the demo currency).
 */

export interface User {
  id: string;
  email: string;
  name: string;
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
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
}

export interface GroupDetail {
  group: Group;
  members: GroupMember[];
}

export interface ExpenseSplit {
  userId: string;
  amountOwed: number;
}

export interface Expense {
  id: string;
  groupId: string;
  paidBy: string;
  description: string;
  amount: number;
  splitType: "equal" | "custom";
  createdAt: string;
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

export interface PendingAction {
  tool: string;
  arguments: unknown;
}

export interface AgentReply {
  type: "message" | "confirmation_required";
  content: string;
  pendingAction?: PendingAction;
  messages: unknown[];
}
