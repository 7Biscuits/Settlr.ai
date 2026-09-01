import { env } from "../config/env.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ChatCompletionResult {
  content: string | null;
  toolCalls: ToolCall[];
}

/**
 * Thin client for DeepSeek's OpenAI-compatible chat completions API with
 * function calling. Kept minimal and dependency-free (uses global fetch).
 */
export async function chatCompletion(
  messages: ChatMessage[],
  tools: unknown[],
): Promise<ChatCompletionResult> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const res = await fetch(`${env.DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL,
      messages,
      tools,
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    choices: {
      message: {
        content: string | null;
        tool_calls?: ToolCall[];
      };
    }[];
  };

  const message = json.choices[0]?.message;
  return {
    content: message?.content ?? null,
    toolCalls: message?.tool_calls ?? [],
  };
}
