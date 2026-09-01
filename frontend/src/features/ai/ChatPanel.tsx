"use client";

import { useState } from "react";
import { apiFetch } from "../../services/apiClient";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { VoiceInput } from "./VoiceInput";

interface PendingAction {
  tool: string;
  arguments: unknown;
}

interface AgentReply {
  type: "message" | "confirmation_required";
  content: string;
  pendingAction?: PendingAction;
  messages: unknown[];
}

interface ChatEntry {
  role: "user" | "assistant";
  text: string;
}

export function ChatPanel() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<unknown[] | undefined>();
  const [pending, setPending] = useState<{
    action: PendingAction;
    messages: unknown[];
    content: string;
  } | null>(null);

  async function send(text: string) {
    if (!text.trim()) return;
    setEntries((e) => [...e, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const reply = await apiFetch<AgentReply>("/agent/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, messages: conversation }),
      });
      setConversation(reply.messages);
      if (reply.type === "confirmation_required" && reply.pendingAction) {
        setPending({
          action: reply.pendingAction,
          messages: reply.messages,
          content: reply.content,
        });
      } else {
        setEntries((e) => [...e, { role: "assistant", text: reply.content }]);
      }
    } catch (err) {
      setEntries((e) => [
        ...e,
        {
          role: "assistant",
          text: err instanceof Error ? err.message : "Request failed",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!pending) return;
    setLoading(true);
    try {
      // The tool_call_id is the id of the last assistant tool call in messages.
      const toolCallId = extractToolCallId(pending.messages);
      const reply = await apiFetch<AgentReply>("/agent/confirm", {
        method: "POST",
        body: JSON.stringify({
          tool: pending.action.tool,
          arguments: pending.action.arguments,
          toolCallId,
          messages: pending.messages,
        }),
      });
      setConversation(reply.messages);
      setEntries((e) => [...e, { role: "assistant", text: reply.content }]);
    } catch (err) {
      setEntries((e) => [
        ...e,
        {
          role: "assistant",
          text: err instanceof Error ? err.message : "Action failed",
        },
      ]);
    } finally {
      setPending(null);
      setLoading(false);
    }
  }

  return (
    <section className="rounded border border-gray-800 p-4">
      <h2 className="mb-3 text-lg font-semibold">AI Assistant</h2>
      <div className="mb-3 flex max-h-52 flex-col gap-2 overflow-auto">
        {entries.map((e, i) => (
          <div
            key={i}
            className={
              e.role === "user"
                ? "self-end rounded bg-blue-700 px-3 py-1"
                : "self-start rounded bg-gray-800 px-3 py-1"
            }
          >
            {e.text}
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-gray-500">
            Ask things like &quot;How much do I owe Rahul?&quot; or &quot;Settle
            everything I owe Rahul.&quot;
          </p>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          className="flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2"
          placeholder="Ask the assistant..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <VoiceInput onTranscript={(t) => setInput(t)} />
        <button
          className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-500 disabled:opacity-50"
          disabled={loading}
        >
          Send
        </button>
      </form>

      {pending && (
        <ConfirmationDialog
          content={pending.content}
          action={pending.action}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        />
      )}
    </section>
  );
}

function extractToolCallId(messages: unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as {
      role?: string;
      tool_calls?: { id: string }[];
    };
    if (m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0) {
      return m.tool_calls[m.tool_calls.length - 1]!.id;
    }
  }
  return "";
}
