import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import {
  updateProfileSchema,
  singleLookupSchema,
  contactsLookupSchema,
} from "../schemas/userSchemas.js";
import {
  getUserProfile,
  updateUserProfile,
  lookupUserByContact,
  bulkLookupContacts,
} from "../services/userService.js";
import { NotFoundError } from "../utils/errors.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { z } from "zod";

const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

const lookupRateLimit = createRateLimiter({ max: 30, windowMs: 60_000 });

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.get("/users/me", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const user = await getUserProfile(userId);
    return reply.send({ user });
  });

  app.patch("/users/me", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const input = updateProfileSchema.parse(request.body);
    const user = await updateUserProfile(userId, input);
    return reply.send({ user });
  });

  app.post("/users/lookup", { preHandler: lookupRateLimit }, async (request, reply) => {
    const input = singleLookupSchema.parse(request.body);
    const user = await lookupUserByContact(input);
    if (!user) {
      throw new NotFoundError("User not found with provided contact information");
    }
    return reply.send({ user });
  });

  app.post("/users/contacts-lookup", { preHandler: lookupRateLimit }, async (request, reply) => {
    const input = contactsLookupSchema.parse(request.body);
    const result = await bulkLookupContacts(input);
    return reply.send(result);
  });


  app.get("/users/:id", async (request, reply) => {
    const { id } = userIdParamSchema.parse(request.params);
    const user = await getUserProfile(id);
    return reply.send({ user });
  });
}
