import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { AppError } from "./utils/errors.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { groupRoutes } from "./routes/groups.js";
import { expenseRoutes } from "./routes/expenses.js";
import { balanceRoutes } from "./routes/balances.js";
import { walletRoutes } from "./routes/wallet.js";
import { agentRoutes } from "./routes/agent.js";
import { voiceRoutes } from "./routes/voice.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: env.JWT_SECRET });

  // Centralized error handling maps domain errors and validation to HTTP codes.
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply
        .code(400)
        .send({ error: "ValidationError", details: error.issues });
    }
    if (error instanceof AppError) {
      return reply
        .code(error.statusCode)
        .send({ error: error.name, message: error.message });
    }
    app.log.error(error);
    return reply
      .code(error.statusCode ?? 500)
      .send({ error: "InternalServerError", message: "Something went wrong" });
  });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(groupRoutes);
  await app.register(expenseRoutes);
  await app.register(balanceRoutes);
  await app.register(walletRoutes);
  await app.register(agentRoutes);
  await app.register(voiceRoutes);

  return app;
}
