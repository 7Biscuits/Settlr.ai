import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import {
  createGroup,
  updateGroup,
  deleteGroup,
  listGroupsForUser,
  inviteOrAddMemberByContact,
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

export const createGroupTool: ToolDefinition = {
  name: "create_group",
  description: "Create a new expense-sharing group. Sensitive: requires confirmation.",
  inputSchema: z.object({
    name: z.string().min(1).max(120),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const { name } = input as { name: string };
    const group = await createGroup(ctx.userId, name);
    return { success: true, data: { group } };
  },
};

export const updateGroupTool: ToolDefinition = {
  name: "update_group",
  description:
    "Update a group's name. Only the group owner can update the group. Sensitive: requires confirmation.",
  inputSchema: z.object({
    groupId: z.string().uuid(),
    name: z.string().min(1).max(120),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const { groupId, name } = input as { groupId: string; name: string };
    const group = await updateGroup(groupId, ctx.userId, { name });
    return { success: true, data: { group } };
  },
};

export const deleteGroupTool: ToolDefinition = {
  name: "delete_group",
  description:
    "Delete an expense-sharing group. Only the group owner can delete it, and all group debts must be settled first. Sensitive: requires confirmation.",
  inputSchema: z.object({
    groupId: z.string().uuid(),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const { groupId } = input as { groupId: string };
    await deleteGroup(groupId, ctx.userId);
    return { success: true, data: { message: "Group deleted successfully" } };
  },
};

export const addFriendTool: ToolDefinition = {
  name: "invite_to_group",
  description: "Add or invite a user to a group. You can provide their email, phone number, or just their name (query). When using query (name), the tool looks up the user and adds them directly if found. If providing email for an unregistered user, it creates an invitation link.",
  inputSchema: z
    .object({
      groupId: z.string().uuid(),
      email: z.string().email().optional(),
      phone: z.string().min(3).max(32).optional(),
      query: z.string().min(1).max(120).optional(),
    })
    .refine((data) => Boolean(data.email || data.phone || data.query), {
      message: "Either email, phone, or query (name) must be provided to add or invite a member",
    }),
  sensitive: true,
  async execute(input, ctx) {
    const { groupId, email, phone, query } = input as {
      groupId: string;
      email?: string;
      phone?: string;
      query?: string;
    };
    const result = await inviteOrAddMemberByContact(groupId, ctx.userId, {
      email,
      phone,
      query,
    });
    return { success: true, data: result };
  },
};


