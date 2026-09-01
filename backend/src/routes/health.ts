import type { FastifyInstance } from "fastify";
import { pingDatabase } from "../database/client.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_req, reply) => {
    const dbOk = await pingDatabase();
    const status = dbOk ? "ok" : "degraded";
    return reply.code(dbOk ? 200 : 503).send({
      status,
      database: dbOk ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });
}
