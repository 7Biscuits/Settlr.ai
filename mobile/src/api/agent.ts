import { apiFetch } from "./client";
import type { AgentReply } from "./types";

/**
 * Sends a message to the backend AI agent. All reasoning, tool calling, and
 * execution happen on the backend — the client never talks to the LLM directly.
 */
export function chat(
  message: string,
  messages?: unknown[],
): Promise<AgentReply> {
  return apiFetch<AgentReply>("/agent/chat", {
    method: "POST",
    body: JSON.stringify({ message, messages }),
  });
}

/**
 * Confirms a previously proposed sensitive action. The backend executes it and
 * returns the verified result; the client never assumes success on its own.
 */
export function confirm(
  proposalId: string,
): Promise<AgentReply> {
  return apiFetch<AgentReply>("/agent/confirm", {
    method: "POST",
    body: JSON.stringify({ proposalId }),
  });
}
