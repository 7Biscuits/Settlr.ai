import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import {
  listGroupsForUser,
  addMemberByEmail,
} from "../../services/groupService.js";

export const getGroupsTool: ToolDefinition = {
  name: "get_groups",
  description: "List the groups the current user belongs to.",
  inputSchema: z.object({}),
  sensitive: false,
  async execute(_input, ctx) {
    const groups = await listGroupsForUser(ctx.userId);
    return { success: true, data: { groups } };
  },
};

export const addFriendTool: ToolDefinition = {
  name: "add_friend",
  description: "Add a user (by email) as a member of a group.",
  inputSchema: z.object({
    groupId: z.string().uuid(),
    email: z.string().email(),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const { groupId, email } = input as { groupId: string; email: string };
    const member = await addMemberByEmail(groupId, ctx.userId, email);
    return { success: true, data: { member } };
  },
};
