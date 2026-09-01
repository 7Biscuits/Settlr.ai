import type { ToolDefinition, ToolSchemaForLLM } from "./types.js";
import {
  getExpensesTool,
  createExpenseTool,
  updateExpenseTool,
  deleteExpenseTool,
} from "./expense/index.js";
import {
  getGroupsTool,
  createGroupTool,
  updateGroupTool,
  deleteGroupTool,
  addFriendTool,
} from "./group/index.js";
import {
  getBalanceTool,
  getGroupBalanceTool,
  getDebtToUserTool,
} from "./balance/index.js";
import {
  checkWalletBalanceTool,
  transferWalletFundsTool,
  settleDebtTool,
} from "./wallet/index.js";
import {
  getMyProfileTool,
  lookupUserByContactTool,
  updateProfileTool,
} from "./user/index.js";
import {
  listConversationsTool,
  getDirectMessagesTool,
  sendDirectMessageTool,
} from "./message/index.js";
import { zodToJsonSchema } from "../utils/zodToJsonSchema.js";

const allTools: ToolDefinition[] = [
  getExpensesTool,
  createExpenseTool,
  updateExpenseTool,
  deleteExpenseTool,
  getGroupsTool,
  createGroupTool,
  updateGroupTool,
  deleteGroupTool,
  addFriendTool,
  getBalanceTool,
  getGroupBalanceTool,
  getDebtToUserTool,
  checkWalletBalanceTool,
  transferWalletFundsTool,
  settleDebtTool,
  getMyProfileTool,
  lookupUserByContactTool,
  updateProfileTool,
  listConversationsTool,
  getDirectMessagesTool,
  sendDirectMessageTool,
];





const registry = new Map<string, ToolDefinition>(
  allTools.map((t) => [t.name, t]),
);

export function getTool(name: string): ToolDefinition | undefined {
  return registry.get(name);
}

export function listTools(): ToolDefinition[] {
  return [...registry.values()];
}

export function isSensitive(name: string): boolean {
  return registry.get(name)?.sensitive ?? true;
}

/** Builds the tool schema array passed to the LLM function-calling API. */
export function getToolSchemasForLLM(): ToolSchemaForLLM[] {
  return listTools().map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: zodToJsonSchema(t.inputSchema),
    },
  }));
}
