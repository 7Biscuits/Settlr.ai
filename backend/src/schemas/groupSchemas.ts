import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const updateGroupSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const groupIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
});

export const invitationTokenSchema = z.object({
  token: z.string().uuid(),
});

export const invitationIdSchema = z.object({
  invitationId: z.string().uuid(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;

