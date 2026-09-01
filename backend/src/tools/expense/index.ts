import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  listExpenses,
} from "../../services/expenseService.js";

const toolParticipantSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().nonnegative().optional(),
  percentage: z.number().nonnegative().max(100).optional(),
  shares: z.number().int().positive().optional(),
});

export const getExpensesTool: ToolDefinition = {
  name: "get_expenses",
  description: "List expenses for a group the current user belongs to.",
  inputSchema: z.object({ groupId: z.string().uuid() }),
  sensitive: false,
  async execute(input, ctx) {
    const { groupId } = input as { groupId: string };
    const expenses = await listExpenses(groupId, ctx.userId);
    return { success: true, data: { expenses } };
  },
};

export const createExpenseTool: ToolDefinition = {
  name: "create_expense",
  description:
    "Create a shared expense in a group. Amounts are in integer minor units. Split types: equal, custom (exact amounts), percentage, or shares (weights). Categories: food, transport, housing, utilities, entertainment, shopping, travel, health, general, other. Accepts optional receiptUrl image attachment.",
  inputSchema: z.object({
    groupId: z.string().uuid(),
    description: z.string().min(1).max(255),
    amount: z.number().int().positive(),
    paidBy: z.string().uuid(),
    category: z.string().min(1).max(50).optional(),
    receiptUrl: z.string().url().max(1024).optional(),
    splitType: z
      .enum(["equal", "custom", "percentage", "shares"])
      .default("equal"),
    participants: z.array(toolParticipantSchema).min(1),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const { groupId, ...rest } = input as {
      groupId: string;
      description: string;
      amount: number;
      paidBy: string;
      category?: string;
      receiptUrl?: string;
      splitType: "equal" | "custom" | "percentage" | "shares";
      participants: {
        userId: string;
        amount?: number;
        percentage?: number;
        shares?: number;
      }[];
    };
    const expense = await createExpense(groupId, ctx.userId, {
      ...rest,
      category: rest.category ?? "general",
    });
    return { success: true, data: { expense } };
  },
};

export const updateExpenseTool: ToolDefinition = {
  name: "update_expense",
  description:
    "Update an existing expense's description, amount, paidBy, category, receiptUrl, split type, or participants. Sensitive: requires confirmation.",
  inputSchema: z.object({
    expenseId: z.string().uuid(),
    description: z.string().min(1).max(255).optional(),
    amount: z.number().int().positive().optional(),
    paidBy: z.string().uuid().optional(),
    category: z.string().min(1).max(50).optional(),
    receiptUrl: z.string().url().max(1024).nullable().optional(),
    splitType: z
      .enum(["equal", "custom", "percentage", "shares"])
      .optional(),
    participants: z.array(toolParticipantSchema).min(1).optional(),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const { expenseId, ...rest } = input as {
      expenseId: string;
      description?: string;
      amount?: number;
      paidBy?: string;
      category?: string;
      receiptUrl?: string | null;
      splitType?: "equal" | "custom" | "percentage" | "shares";
      participants?: {
        userId: string;
        amount?: number;
        percentage?: number;
        shares?: number;
      }[];
    };
    const expense = await updateExpense(expenseId, ctx.userId, rest);
    return { success: true, data: { expense } };
  },
};


export const deleteExpenseTool: ToolDefinition = {
  name: "delete_expense",
  description:
    "Delete an expense and automatically reverse its debt balance allocations. Sensitive: requires confirmation.",
  inputSchema: z.object({
    expenseId: z.string().uuid(),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const { expenseId } = input as { expenseId: string };
    await deleteExpense(expenseId, ctx.userId);
    return { success: true, data: { message: "Expense deleted successfully" } };
  },
};

