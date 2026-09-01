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
import { dashboardRoutes } from "./routes/dashboard.js";
import { userRoutes } from "./routes/users.js";
import { messageRoutes } from "./routes/messages.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
    bodyLimit: 15_000_000,
  });


  const corsOrigins = env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  await app.register(cors, {
    origin: env.NODE_ENV === "production" ? corsOrigins : true,
  });
  await app.register(jwt, { secret: env.JWT_SECRET });

  // Lightweight baseline headers without an additional dependency. The API is
  // JSON-only, so a restrictive CSP is unnecessary here.
  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("Referrer-Policy", "no-referrer");
    reply.header("Permissions-Policy", "camera=(), geolocation=()");
    if (env.NODE_ENV === "production") {
      reply.header("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    }
    return payload;
  });

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
  await app.register(userRoutes);
  await app.register(messageRoutes);
  await app.register(dashboardRoutes);
  await app.register(groupRoutes);
  await app.register(expenseRoutes);
  await app.register(balanceRoutes);
  await app.register(walletRoutes);
  await app.register(agentRoutes);
  await app.register(voiceRoutes);


  return app;
}

