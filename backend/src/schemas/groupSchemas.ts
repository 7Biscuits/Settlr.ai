import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1).max(120),
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
export type AddMemberInput = z.infer<typeof addMemberSchema>;
