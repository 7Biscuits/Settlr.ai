import type { FastifyInstance } from "fastify";
import {
  registerUser,
  verifyCredentials,
  getUserById,
  revokeToken,
} from "../services/authService.js";
import { signAccessToken } from "../utils/jwt.js";
import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import { authenticate } from "../middleware/authenticate.js";
import { NotFoundError } from "../utils/errors.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const authRateLimit = createRateLimiter({ max: 10, windowMs: 60_000 });

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", { preHandler: authRateLimit }, async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const user = await registerUser(body);
    const token = signAccessToken(app, { id: user.id, email: user.email });
    return reply.code(201).send({ user, token });
  });

  app.post("/auth/login", { preHandler: authRateLimit }, async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await verifyCredentials(body.email, body.password);
    const token = signAccessToken(app, { id: user.id, email: user.email });
    return reply.send({ user, token });
  });

  app.post(
    "/auth/logout",
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.user as { id: string };
      const authHeader = request.headers.authorization;
      const rawToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader;
      if (rawToken) {
        const decoded = app.jwt.decode<{ exp?: number }>(rawToken);
        const expiresAt = decoded?.exp
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await revokeToken({ rawToken, userId: id, expiresAt });
      }
      return reply.code(200).send({ success: true, message: "Logged out successfully" });
    },
  );

  app.get(
    "/auth/me",
    { preHandler: authenticate },
    async (request, reply) => {
      const { id } = request.user as { id: string };
      const user = await getUserById(id);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      return reply.send({ user });
    },
  );
}

