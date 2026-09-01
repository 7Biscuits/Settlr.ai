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
  description:
    "Add or invite one or more users to a group. You can provide a single user via query (name), userId, email, or phone — OR provide a list of members via the members array (e.g. ['Alice', 'Ethan']).",
  inputSchema: z
    .object({
      groupId: z.string().uuid(),
      userId: z.string().optional(),
      user_id: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      query: z.string().optional(),
      name: z.string().optional(),
      members: z.array(z.string()).optional(),
    })
    .refine(
      (data) =>
        Boolean(
          data.userId ||
            data.user_id ||
            data.email ||
            data.phone ||
            data.query ||
            data.name ||
            (data.members && data.members.length > 0),
        ),
      {
        message:
          "Provide userId, email, phone, query (name), or a list of members to add.",
      },
    ),
  sensitive: true,
  async execute(input, ctx) {
    const {
      groupId,
      userId,
      user_id,
      email,
      phone,
      query,
      name,
      members,
    } = input as {
      groupId: string;
      userId?: string;
      user_id?: string;
      email?: string;
      phone?: string;
      query?: string;
      name?: string;
      members?: string[];
    };

    if (Array.isArray(members) && members.length > 0) {
      const { addMultipleMembersToGroup } = await import(
        "../../services/groupService.js"
      );
      const result = await addMultipleMembersToGroup(
        groupId,
        ctx.userId,
        members,
      );
      return { success: true, data: result };
    }

    const resolvedUserId = userId || user_id;
    const resolvedQuery = query || name;

    const result = await inviteOrAddMemberByContact(groupId, ctx.userId, {
      userId: resolvedUserId,
      email,
      phone,
      query: resolvedQuery,
    });
    return { success: true, data: result };
  },
};



