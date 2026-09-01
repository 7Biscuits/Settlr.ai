import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import { getWalletBalance } from "../../services/walletService.js";
import { transferFunds } from "../../services/walletService.js";
import { settleDebt } from "../../services/settlementService.js";

export const checkWalletBalanceTool: ToolDefinition = {
  name: "check_wallet_balance",
  description: "Get the current user's in-app wallet balance (demo currency).",
  inputSchema: z.object({}),
  sensitive: false,
  async execute(_input, ctx) {
    const balance = await getWalletBalance(ctx.userId);
    return { success: true, data: { balance } };
  },
};

import { randomUUID } from "node:crypto";

export const transferWalletFundsTool: ToolDefinition = {
  name: "transfer_wallet_funds",
  description:
    "Transfer demo wallet funds from the current user to another user. Sensitive: requires confirmation.",
  inputSchema: z.object({
    toUserId: z.string().uuid(),
    amount: z.number().int().positive(),
    idempotencyKey: z
      .string()
      .min(8)
      .max(128)
      .optional()
      .default(() => randomUUID()),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const { toUserId, amount, idempotencyKey } = input as {
      toUserId: string;
      amount: number;
      idempotencyKey?: string;
    };
    const transaction = await transferFunds(
      ctx.userId,
      toUserId,
      amount,
      idempotencyKey || randomUUID(),
    );
    return { success: true, data: { transaction } };
  },
};

export const settleDebtTool: ToolDefinition = {
  name: "settle_debt",
  description:
    "Settle an outstanding debt to another group member using wallet funds. Sensitive: requires confirmation.",
  inputSchema: z.object({
    groupId: z.string().uuid(),
    toUserId: z.string().uuid(),
    amount: z.number().int().positive(),
    idempotencyKey: z
      .string()
      .min(8)
      .max(128)
      .optional()
      .default(() => randomUUID()),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const { groupId, toUserId, amount, idempotencyKey } = input as {
      groupId: string;
      toUserId: string;
      amount: number;
      idempotencyKey?: string;
    };
    const result = await settleDebt({
      groupId,
      fromUserId: ctx.userId,
      toUserId,
      amount,
      idempotencyKey: idempotencyKey || randomUUID(),
    });
    return { success: true, data: result };
  },
};

