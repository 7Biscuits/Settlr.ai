import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import {
  createGroupSchema,
  addMemberSchema,
} from "../schemas/groupSchemas.js";
import {
  createGroup,
  listGroupsForUser,
  getGroup,
  addMemberByEmail,
  removeMember,
} from "../services/groupService.js";

export async function groupRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.post("/groups", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { name } = createGroupSchema.parse(request.body);
    const group = await createGroup(userId, name);
    return reply.code(201).send({ group });
  });

  app.get("/groups", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const groups = await listGroupsForUser(userId);
    return reply.send({ groups });
  });

  app.get("/groups/:id", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };
    const result = await getGroup(id, userId);
    return reply.send(result);
  });

  app.post("/groups/:id/members", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { email } = addMemberSchema.parse(request.body);
    const member = await addMemberByEmail(id, userId, email);
    return reply.code(201).send({ member });
  });

  app.delete("/groups/:id/members/:userId", async (request, reply) => {
    const { id: requesterId } = request.user as { id: string };
    const { id, userId } = request.params as { id: string; userId: string };
    await removeMember(id, requesterId, userId);
    return reply.code(204).send();
  });
}
