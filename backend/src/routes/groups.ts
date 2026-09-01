import type { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import {
  createGroupSchema,
  updateGroupSchema,
  groupIdParamSchema,
  addMemberSchema,
  invitationIdSchema,
  invitationTokenSchema,
} from "../schemas/groupSchemas.js";
import {
  createGroup,
  updateGroup,
  deleteGroup,
  listGroupsForUser,
  getGroup,
  addMemberByEmail,
  acceptGroupInvitation,
  cancelGroupInvitation,
  removeMember,
  getInvitationForRecipient,
  inviteOrAddMemberByEmail,
  leaveGroup,
  listGroupInvitations,
} from "../services/groupService.js";

import { z } from "zod";

const groupUserParamSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

const groupInvitationParamSchema = z.object({
  id: z.string().uuid(),
  invitationId: z.string().uuid(),
});

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
    const { id } = groupIdParamSchema.parse(request.params);
    const result = await getGroup(id, userId);
    return reply.send(result);
  });

  app.patch("/groups/:id", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = groupIdParamSchema.parse(request.params);
    const input = updateGroupSchema.parse(request.body);
    const group = await updateGroup(id, userId, input);
    return reply.send({ group });
  });

  app.delete("/groups/:id", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = groupIdParamSchema.parse(request.params);
    await deleteGroup(id, userId);
    return reply.code(204).send();
  });


  app.post("/groups/:id/members", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = groupIdParamSchema.parse(request.params);
    const { email } = addMemberSchema.parse(request.body);
    const member = await addMemberByEmail(id, userId, email);
    return reply.code(201).send({ member });
  });

  // An existing PayPilot account is added immediately. Otherwise this creates
  // an email-bound invitation that the mobile client can deliver via SMS.
  app.post("/groups/:id/invitations", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = groupIdParamSchema.parse(request.params);
    const { email } = addMemberSchema.parse(request.body);
    const result = await inviteOrAddMemberByEmail(id, userId, email);
    return reply.code(result.kind === "member_added" ? 201 : 202).send(result);
  });

  app.get("/groups/:id/invitations", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = groupIdParamSchema.parse(request.params);
    const invitations = await listGroupInvitations(id, userId);
    return reply.send({ invitations });
  });

  app.delete("/groups/:id/invitations/:invitationId", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id, invitationId } = groupInvitationParamSchema.parse(request.params);
    await cancelGroupInvitation(id, invitationId, userId);
    return reply.code(204).send();
  });

  app.get("/invitations/:token", async (request, reply) => {
    const { email } = request.user as { email: string };
    const { token } = invitationTokenSchema.parse(request.params);
    const invitation = await getInvitationForRecipient(token, email);
    return reply.send({ invitation });
  });

  app.post("/invitations/:token/accept", async (request, reply) => {
    const { id, email } = request.user as { id: string; email: string };
    const { token } = invitationTokenSchema.parse(request.params);
    const result = await acceptGroupInvitation(token, id, email);
    return reply.send(result);
  });

  app.delete("/groups/:id/members/me", async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = groupIdParamSchema.parse(request.params);
    await leaveGroup(id, userId);
    return reply.code(204).send();
  });

  app.delete("/groups/:id/members/:userId", async (request, reply) => {
    const { id: requesterId } = request.user as { id: string };
    const { id, userId } = groupUserParamSchema.parse(request.params);
    await removeMember(id, requesterId, userId);
    return reply.code(204).send();
  });
}

