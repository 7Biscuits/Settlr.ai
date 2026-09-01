import { runAgent, confirmAction } from "../orchestration/orchestrator.js";
import type { ChatMessage } from "../../services/deepseekClient.js";
import type { ToolContext } from "../../tools/types.js";

/**
 * Public agent facade used by the HTTP layer. Keeps orchestration details
 * out of the route handlers.
 */
export const agent = {
  chat(ctx: ToolContext, message: string, priorMessages?: ChatMessage[]) {
    return runAgent(ctx, message, priorMessages);
  },
  confirm(
    ctx: ToolContext,
    toolName: string,
    args: unknown,
    toolCallId: string,
    priorMessages: ChatMessage[],
  ) {
    return confirmAction(ctx, toolName, args, toolCallId, priorMessages);
  },
};
