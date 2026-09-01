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
  let rawBase = (env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").trim().replace(/\/+$/, "");
  let endpoint: string;
  if (rawBase.endsWith("/chat/completions")) {
    endpoint = rawBase;
  } else if (rawBase.endsWith("/v1")) {
    endpoint = `${rawBase}/chat/completions`;
  } else if (rawBase.includes("deepseek.com")) {
    endpoint = `${rawBase}/chat/completions`;
  } else {
    endpoint = `${rawBase}/v1/chat/completions`;
  }

  const payload: Record<string, unknown> = {
    model: env.DEEPSEEK_MODEL || "deepseek-chat",
    messages,
  };

  if (Array.isArray(tools) && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = "auto";
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();

  if (!res.ok) {
    let errorDetail = responseText;
    try {
      const parsed = JSON.parse(responseText) as {
        error?: { message?: string; code?: string | number };
        message?: string;
      };
      errorDetail = parsed.error?.message ?? parsed.message ?? responseText;
    } catch {
      // not JSON
    }

    if (res.status === 402 || errorDetail.toLowerCase().includes("insufficient balance")) {
      throw new Error(
        "AI API: Insufficient balance. Please recharge API credits or update DEEPSEEK_API_KEY.",
      );
    }
    throw new Error(`AI API error ${res.status}: ${errorDetail}`);
  }

  let json: {
    choices: {
      message: {
        content: string | null;
        tool_calls?: ToolCall[];
      };
    }[];
  };

  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error(`AI API error: Received invalid JSON response from ${endpoint}`);
  }

  const message = json.choices?.[0]?.message;
  return {
    content: message?.content ?? null,
    toolCalls: message?.tool_calls ?? [],
  };

}
