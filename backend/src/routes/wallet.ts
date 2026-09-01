import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import {
  topUpSchema,
  transferSchema,
  settleSchema,
} from "../schemas/walletSchemas.js";
import {
  getWalletBalance,
  topUp,
  transferFunds,
  listTransactions,
} from "../services/walletService.js";
import { settleDebt } from "../services/settlementService.js";

import { z } from "zod";

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

import { createRateLimiter } from "../middleware/rateLimit.js";

const walletRateLimit = createRateLimiter({ max: 30, windowMs: 60_000 });

export async function walletRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.get("/wallet", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const balance = await getWalletBalance(userId);
    return reply.send({ balance });
  });

  app.get("/wallet/transactions", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const pagination = paginationSchema.parse(request.query ?? {});
    const transactions = await listTransactions(userId, pagination);
    return reply.send({ transactions });
  });

  app.post("/wallet/topup", { preHandler: walletRateLimit }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { amount, idempotencyKey } = topUpSchema.parse(request.body);
    const result = await topUp(userId, amount, idempotencyKey);
    return reply.send(result);
  });

  app.post("/wallet/transfer", { preHandler: walletRateLimit }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { toUserId, amount, idempotencyKey } = transferSchema.parse(
      request.body,
    );
    const transaction = await transferFunds(
      userId,
      toUserId,
      amount,
      idempotencyKey,
    );
    return reply.send({ transaction });
  });

  app.post("/wallet/settle", { preHandler: walletRateLimit }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { groupId, toUserId, amount, idempotencyKey } = settleSchema.parse(
      request.body,
    );
    const result = await settleDebt({
      groupId,
      fromUserId: userId,
      toUserId,
      amount,
      idempotencyKey,
    });
    return reply.send(result);
  });
}

