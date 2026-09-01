import {
  chatCompletion,
  type ChatMessage,
  type ToolCall,
} from "../../services/deepseekClient.js";
import { getToolSchemasForLLM, isSensitive } from "../../tools/registry.js";
import { executeToolCall } from "./confirmation.js";
import { SYSTEM_PROMPT } from "../prompts/system.js";
import type { ToolContext } from "../../tools/types.js";

export interface AgentReply {
  // "message" => final assistant text; "confirmation_required" => sensitive
  // action proposed and awaiting user confirmation.
  type: "message" | "confirmation_required";
  content: string;
  pendingAction?: {
    tool: string;
    arguments: unknown;
  };
  // Conversation state to send back on the next turn.
  messages: ChatMessage[];
}

const MAX_STEPS = 8;

/**
 * Runs the reason -> tool -> result loop. Read tools execute automatically.
 * The first sensitive action the model requests halts the loop and returns a
 * confirmation request; it is only executed once the user confirms (see
 * `confirmAction`). The agent never fabricates results.
 */
export async function runAgent(
  ctx: ToolContext,
  userMessage: string,
  priorMessages?: ChatMessage[],
): Promise<AgentReply> {
  const messages: ChatMessage[] = priorMessages
    ? [...priorMessages, { role: "user", content: userMessage }]
    : [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ];

  const tools = getToolSchemasForLLM();

  for (let step = 0; step < MAX_STEPS; step++) {
    const result = await chatCompletion(messages, tools);

    if (result.toolCalls.length === 0) {
      messages.push({ role: "assistant", content: result.content });
      return {
        type: "message",
        content: result.content ?? "",
        messages,
      };
    }

    messages.push({
      role: "assistant",
      content: result.content,
      tool_calls: result.toolCalls,
    });

    for (const call of result.toolCalls) {
      if (isSensitive(call.function.name)) {
        // Halt for confirmation. The pending action is returned to the caller
        // and NOT executed until the user confirms.
        let args: unknown = {};
        try {
          args = call.function.arguments
            ? JSON.parse(call.function.arguments)
            : {};
        } catch {
          args = {};
        }
        return {
          type: "confirmation_required",
          content:
            result.content ??
            `I need your confirmation to run ${call.function.name}.`,
          pendingAction: { tool: call.function.name, arguments: args },
          messages,
        };
      }

      const toolResult = await executeToolCall(
        call.function.name,
        call.function.arguments,
        ctx,
      );
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content: JSON.stringify(toolResult),
      });
    }
  }

  return {
    type: "message",
    content: "I couldn't complete the request within the step limit.",
    messages,
  };
}

/**
 * Executes a previously proposed sensitive action after explicit user
 * confirmation, then resumes the agent so it can report the verified result.
 */
export async function confirmAction(
  ctx: ToolContext,
  toolName: string,
  args: unknown,
  toolCallId: string,
  priorMessages: ChatMessage[],
): Promise<AgentReply> {
  const toolResult = await executeToolCall(
    toolName,
    JSON.stringify(args ?? {}),
    ctx,
  );

  const messages: ChatMessage[] = [
    ...priorMessages,
    {
      role: "tool",
      tool_call_id: toolCallId,
      name: toolName,
      content: JSON.stringify(toolResult),
    },
  ];

  // Ask the model to summarize the verified outcome (no further tools needed).
  const result = await chatCompletion(messages, getToolSchemasForLLM());
  messages.push({ role: "assistant", content: result.content });
  return {
    type: "message",
    content:
      result.content ??
      (toolResult.success
        ? "Action completed."
        : `Action failed: ${toolResult.error}`),
    messages,
  };
}
