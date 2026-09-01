import type { FastifyInstance } from "fastify";
import {
  registerUser,
  verifyCredentials,
  getUserById,
} from "../services/authService.js";
import { signAccessToken } from "../utils/jwt.js";
import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import { authenticate } from "../middleware/authenticate.js";
import { NotFoundError } from "../utils/errors.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const user = await registerUser(body);
    const token = signAccessToken(app, { id: user.id, email: user.email });
    return reply.code(201).send({ user, token });
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await verifyCredentials(body.email, body.password);
    const token = signAccessToken(app, { id: user.id, email: user.email });
    return reply.send({ user, token });
  });

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
