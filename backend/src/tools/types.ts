import { z } from "zod";

export interface ToolContext {
  /** The authenticated user on whose behalf the tool runs. Auth is never bypassed. */
  userId: string;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ToolDefinition<TInput = unknown> {
  name: string;
  description: string;
  /** Zod schema used to re-validate LLM-supplied arguments on the backend. */
  inputSchema: z.ZodType<TInput>;
  /** Read tools are safe to auto-run; sensitive action tools require confirmation. */
  sensitive: boolean;
  /** Executes the tool after validation, using backend services only. */
  execute: (input: TInput, ctx: ToolContext) => Promise<ToolResult>;
}

/** JSON-schema-like description of a tool for the LLM function-calling API. */
export interface ToolSchemaForLLM {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
