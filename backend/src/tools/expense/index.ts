import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import {
  createExpense,
  listExpenses,
} from "../../services/expenseService.js";

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
    "Create a shared expense in a group. Amounts are in integer minor units. Split equally or with custom per-participant amounts.",
  inputSchema: z.object({
    groupId: z.string().uuid(),
    description: z.string().min(1).max(255),
    amount: z.number().int().positive(),
    paidBy: z.string().uuid(),
    splitType: z.enum(["equal", "custom"]).default("equal"),
    participants: z
      .array(
        z.object({
          userId: z.string().uuid(),
          amount: z.number().int().nonnegative().optional(),
        }),
      )
      .min(1),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const { groupId, ...rest } = input as {
      groupId: string;
      description: string;
      amount: number;
      paidBy: string;
      splitType: "equal" | "custom";
      participants: { userId: string; amount?: number }[];
    };
    const expense = await createExpense(groupId, ctx.userId, rest);
    return { success: true, data: { expense } };
  },
};
