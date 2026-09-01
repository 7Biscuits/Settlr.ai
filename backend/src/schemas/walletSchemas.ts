import { z } from "zod";

export const topUpSchema = z.object({
  amount: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(128),
});

export const transferSchema = z.object({
  toUserId: z.string().uuid(),
  amount: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(128),
});

export const settleSchema = z.object({
  groupId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amount: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(128),
});

export type TopUpInput = z.infer<typeof topUpSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type SettleInput = z.infer<typeof settleSchema>;
