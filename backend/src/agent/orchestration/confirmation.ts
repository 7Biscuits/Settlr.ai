import { getTool } from "../../tools/registry.js";
import type { ToolContext, ToolResult } from "../../tools/types.js";

/**
 * Executes a tool by name after re-validating the LLM-supplied arguments with
 * the tool's own Zod schema. The LLM's arguments are never trusted directly;
 * validation and authorization happen here and inside the backend services.
 */
export async function executeToolCall(
  name: string,
  rawArgs: string,
  ctx: ToolContext,
): Promise<ToolResult> {
  const tool = getTool(name);
  if (!tool) {
    return { success: false, error: `Unknown tool: ${name}` };
  }

  let parsedArgs: unknown;
  try {
    parsedArgs = rawArgs ? JSON.parse(rawArgs) : {};
  } catch {
    return { success: false, error: `Invalid JSON arguments for ${name}` };
  }

  const validation = tool.inputSchema.safeParse(parsedArgs);
  if (!validation.success) {
    return {
      success: false,
      error: `Invalid arguments for ${name}: ${validation.error.message}`,
    };
  }

  try {
    return await tool.execute(validation.data, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    return { success: false, error: message };
  }
}
