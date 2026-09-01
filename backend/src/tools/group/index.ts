import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import {
  createGroup,
  updateGroup,
  deleteGroup,
  listGroupsForUser,
  inviteOrAddMemberByContact,
  addMultipleMembersToGroup,
} from "../../services/groupService.js";
import { ValidationError } from "../../utils/errors.js";

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
  description:
    "Create a new expense-sharing group. Optionally include members to add immediately (e.g. members: ['Alice', 'Bob']). Sensitive: requires confirmation.",
  inputSchema: z.object({
    name: z.string().optional(),
    group_name: z.string().optional(),
    groupName: z.string().optional(),
    members: z.array(z.string()).optional(),
    users: z.array(z.string()).optional(),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const raw = (input || {}) as Record<string, unknown>;
    const groupName = (raw.name || raw.group_name || raw.groupName || "New Group") as string;
    const group = await createGroup(ctx.userId, String(groupName).trim());

    const rawMembers = (raw.members || raw.users) as string[] | undefined;
    if (Array.isArray(rawMembers) && rawMembers.length > 0) {
      const addRes = await addMultipleMembersToGroup(group.id, ctx.userId, rawMembers);
      return { success: true, data: { group, members: addRes } };
    }

    return { success: true, data: { group } };
  },
};

export const updateGroupTool: ToolDefinition = {
  name: "update_group",
  description:
    "Update a group's name. Only the group owner can update the group. Sensitive: requires confirmation.",
  inputSchema: z.object({
    groupId: z.string().optional(),
    group_id: z.string().optional(),
    name: z.string().min(1).max(120),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const raw = (input || {}) as Record<string, unknown>;
    const groupId = (raw.groupId || raw.group_id) as string;
    const name = raw.name as string;
    const group = await updateGroup(groupId, ctx.userId, { name });
    return { success: true, data: { group } };
  },
};

export const deleteGroupTool: ToolDefinition = {
  name: "delete_group",
  description:
    "Delete an expense-sharing group. Only the group owner can delete it, and all group debts must be settled first. Sensitive: requires confirmation.",
  inputSchema: z.object({
    groupId: z.string().optional(),
    group_id: z.string().optional(),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const raw = (input || {}) as Record<string, unknown>;
    const groupId = (raw.groupId || raw.group_id) as string;
    await deleteGroup(groupId, ctx.userId);
    return { success: true, data: { message: "Group deleted successfully" } };
  },
};

export const addFriendTool: ToolDefinition = {
  name: "invite_to_group",
  description:
    "Add or invite one or more users to a group. You can provide groupId (or group name), and members to add via name, email, phone, or userId (e.g. members: ['Alice', 'Bob'] or query: 'Alice').",
  inputSchema: z.object({
    groupId: z.string().optional(),
    group_id: z.string().optional(),
    group: z.string().optional(),
    groupName: z.string().optional(),
    group_name: z.string().optional(),
    userId: z.string().optional(),
    user_id: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    query: z.string().optional(),
    name: z.string().optional(),
    user: z.string().optional(),
    members: z.array(z.string()).optional(),
    users: z.array(z.string()).optional(),
    user_ids: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
  }),
  sensitive: true,
  async execute(input, ctx) {
    const raw = (input || {}) as Record<string, unknown>;
    const rawGroup = (raw.groupId ||
      raw.group_id ||
      raw.group ||
      raw.groupName ||
      raw.group_name) as string | undefined;

    if (!rawGroup) {
      throw new ValidationError("A group ID or group name is required to add members.");
    }

    // Resolve group ID: if it's already a UUID, use directly. Otherwise look up by name.
    let resolvedGroupId = String(rawGroup).trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        resolvedGroupId,
      );

    if (!isUuid) {
      const userGroups = await listGroupsForUser(ctx.userId);
      const match = userGroups.find(
        (g) =>
          g.name.toLowerCase() === resolvedGroupId.toLowerCase() ||
          g.name.toLowerCase().includes(resolvedGroupId.toLowerCase()) ||
          resolvedGroupId.toLowerCase().includes(g.name.toLowerCase()),
      );
      if (!match) {
        throw new ValidationError(
          `Group "${resolvedGroupId}" not found. Please create the group first.`,
        );
      }
      resolvedGroupId = match.id;
    }

    // Check for batch members list
    const rawMembersList = (raw.members ||
      raw.users ||
      raw.user_ids ||
      raw.userIds) as string[] | undefined;

    if (Array.isArray(rawMembersList) && rawMembersList.length > 0) {
      const result = await addMultipleMembersToGroup(
        resolvedGroupId,
        ctx.userId,
        rawMembersList,
      );
      return { success: true, data: result };
    }

    // Single member addition
    const resolvedUserId = (raw.userId || raw.user_id) as string | undefined;
    const resolvedQuery = (raw.query || raw.name || raw.user) as string | undefined;
    const resolvedEmail = raw.email as string | undefined;
    const resolvedPhone = raw.phone as string | undefined;

    const result = await inviteOrAddMemberByContact(resolvedGroupId, ctx.userId, {
      userId: resolvedUserId,
      email: resolvedEmail,
      phone: resolvedPhone,
      query: resolvedQuery,
    });
    return { success: true, data: result };
  },
};
