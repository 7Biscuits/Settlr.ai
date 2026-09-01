import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import {
  getGroupBalancesForUser,
  getOverallBalancesForUser,
} from "../services/balanceService.js";

export async function balanceRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.get("/balances", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const balances = await getOverallBalancesForUser(userId);
    return reply.send({ balances });
  });

  app.get("/groups/:groupId/balances", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { groupId } = request.params as { groupId: string };
    const balances = await getGroupBalancesForUser(groupId, userId);
    return reply.send({ balances });
  });
}
