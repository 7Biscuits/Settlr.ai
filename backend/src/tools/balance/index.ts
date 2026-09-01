import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import {
  getOverallBalancesForUser,
  getGroupBalancesForUser,
  getDebtToUserInGroup,
  findGroupMemberByName,
} from "../../services/balanceService.js";
import { assertMember } from "../../services/groupService.js";

export const getBalanceTool: ToolDefinition = {
  name: "get_balance",
  description:
    "Get the current user's overall balances with everyone (who they owe and who owes them).",
  inputSchema: z.object({}),
  sensitive: false,
  async execute(_input, ctx) {
    const balances = await getOverallBalancesForUser(ctx.userId);
    return { success: true, data: { balances } };
  },
};

export const getGroupBalanceTool: ToolDefinition = {
  name: "get_group_balance",
  description: "Get the current user's balances within a specific group.",
  inputSchema: z.object({ groupId: z.string().uuid() }),
  sensitive: false,
  async execute(input, ctx) {
    const { groupId } = input as { groupId: string };
    const balances = await getGroupBalancesForUser(groupId, ctx.userId);
    return { success: true, data: { balances } };
  },
};

export const getDebtToUserTool: ToolDefinition = {
  name: "get_debt_to_user",
  description:
    "Get how much the current user owes another group member, resolving the member by name within a group.",
  inputSchema: z.object({
    groupId: z.string().uuid(),
    name: z.string().min(1),
  }),
  sensitive: false,
  async execute(input, ctx) {
    const { groupId, name } = input as { groupId: string; name: string };
    await assertMember(groupId, ctx.userId);
    const member = await findGroupMemberByName(groupId, name);
    if (!member) {
      return { success: false, error: `No group member named "${name}"` };
    }
    const owed = await getDebtToUserInGroup(groupId, ctx.userId, member.id);
    return {
      success: true,
      data: { userId: member.id, name: member.name, amountOwed: owed },
    };
  },
};

