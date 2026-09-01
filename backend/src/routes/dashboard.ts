import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import { getDashboardSummary } from "../services/dashboardService.js";

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get("/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    return reply.send(await getDashboardSummary(userId));
  });
}
