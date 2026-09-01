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

export async function walletRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.get("/wallet", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const balance = await getWalletBalance(userId);
    return reply.send({ balance });
  });

  app.get("/wallet/transactions", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const transactions = await listTransactions(userId);
    return reply.send({ transactions });
  });

  app.post("/wallet/topup", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { amount, idempotencyKey } = topUpSchema.parse(request.body);
    const result = await topUp(userId, amount, idempotencyKey);
    return reply.send(result);
  });

  app.post("/wallet/transfer", async (request, reply) => {
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

  app.post("/wallet/settle", async (request, reply) => {
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
