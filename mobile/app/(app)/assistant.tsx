import React, { useState, useRef, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chat, confirm } from "../../src/api/agent";
import type { AgentReply, PendingAction } from "../../src/api/types";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import { ConfirmSheet } from "../../src/components/ConfirmSheet";
import { useVoiceRecorder } from "../../src/features/ai/useVoiceRecorder";
import { useVoicePlayer } from "../../src/features/ai/useVoicePlayer";
import { ApiError } from "../../src/api/client";
import { transcribe } from "../../src/api/voice";
import * as FileSystem from "expo-file-system";

/** Infers an STT-friendly MIME type from the recording's file extension. */
function mimeTypeForUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".mp4")) return "audio/mp4";
  return "audio/m4a";
}

interface ChatEntry {
  role: "user" | "assistant" | "system";
  text: string;
}

/** Formats tool arguments into a human-readable summary for the confirm sheet. */
function formatActionDetails(tool: string, args: unknown): string {
  const a = args as Record<string, unknown>;
  switch (tool) {
    case "create_group":
      return `Create group "${a.name}"`;
    case "invite_to_group":
      return `Add ${a.query || a.email || a.phone || "member"} to group`;
    case "create_expense": {
      const amountRupees = typeof a.amount === "number" ? (a.amount / 100).toFixed(2) : "?";
      return `₹${amountRupees} for "${a.description}" split ${a.splitType || "equal"}`;
    }
    case "settle_debt":
      return `Settle debt of ₹${typeof a.amount === "number" ? (a.amount / 100).toFixed(2) : "?"}`;
    case "transfer_wallet_funds":
      return `Transfer ₹${typeof a.amount === "number" ? (a.amount / 100).toFixed(2) : "?"}`;
    default:
      return JSON.stringify(args);
  }
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const voice = useVoiceRecorder();
  const player = useVoicePlayer();
  const scrollRef = useRef<ScrollView>(null);

  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<unknown[] | undefined>();

  // Backend-proposed sensitive action awaiting confirmation.
  const [pending, setPending] = useState<{
    action: PendingAction;
    content: string;
    speakReply: boolean;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [entries, loading]);

  function pushAssistant(text: string) {
    setEntries((e) => [...e, { role: "assistant", text }]);
  }

  /**
   * Sends a user message straight to the backend AI agent. ALL intent
   * recognition, tool calling, and multi-step orchestration happens on the
   * server. The mobile app is a thin display layer.
   */
  async function handleSend(text: string, speakReply = false) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    setEntries((e) => [...e, { role: "user", text: trimmed }]);

    setLoading(true);
    try {
      const reply = await chat(trimmed, conversation);
      await applyReply(reply, speakReply);
    } catch (err) {
      pushAssistant(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * Processes a reply from the backend. If it's a confirmation request, shows
   * the ConfirmSheet. If it's a final message, displays it. Handles chained
   * confirmations automatically — the feedback loop.
   */
  async function applyReply(reply: AgentReply, speakReply = false) {
    setConversation(reply.messages);
    if (reply.type === "confirmation_required" && reply.pendingAction) {
      setPending({
        action: reply.pendingAction,
        content: reply.content,
        speakReply,
      });
      if (reply.content) pushAssistant(reply.content);
    } else {
      pushAssistant(reply.content);
    }
    if (speakReply && reply.content) {
      await player.speak(reply.content);
    }
  }

  /**
   * Confirms a pending sensitive action. After the backend executes it and
   * returns the result, applyReply is called again — if the agent has more
   * actions to propose (e.g. next step in a compound command), the next
   * ConfirmSheet appears automatically. This is the feedback loop.
   */
  async function handleConfirm() {
    if (!pending) return;
    setConfirming(true);
    try {
      const speakReply = pending.speakReply;
      const reply = await confirm(pending.action.proposalId);
      setPending(null);
      // applyReply will show the next ConfirmSheet if the agent wants to
      // continue with more actions (chained confirmations / feedback loop)
      await applyReply(reply, speakReply);
    } catch (err) {
      setPending(null);
      pushAssistant(
        err instanceof ApiError ? err.message : "The action could not be completed.",
      );
    } finally {
      setConfirming(false);
    }
  }

  async function handleMic() {
    if (voice.recording) {
      const uri = await voice.stop();
      if (!uri) return;
      setLoading(true);
      try {
        const audioBase64 = await (FileSystem as any).readAsStringAsync(uri, {
          encoding: (FileSystem as any).EncodingType?.Base64 || "base64",
        });
        const mimeType = mimeTypeForUri(uri);
        const { text } = await transcribe(audioBase64, mimeType);
        const trimmed = text.trim();
        if (!trimmed) {
          pushAssistant("I couldn't hear anything. Please try again.");
          return;
        }
        await handleSend(trimmed, true);
      } catch (err) {
        pushAssistant(
          err instanceof ApiError
            ? err.message
            : "Voice transcription isn't available right now. Please type your command.",
        );
      } finally {
        setLoading(false);
      }
    } else {
      await voice.start();
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="border-b border-border p-4">
        <Text className="text-2xl font-bold text-text">Assistant</Text>
        <Text className="text-sm text-muted">
          Try: "Add Alice and Bob to a group and split ₹200 for lunch"
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 10 }}
      >
        {entries.length === 0 ? (
          <View className="gap-2">
            {[
              "How much do I owe?",
              "Who owes me?",
              "Create a group called Weekend Trip",
              "Add Alice and Bob to a group and split ₹100 for snacks",
              "Settle everything I owe",
            ].map((s) => (
              <Pressable
                key={s}
                onPress={() => handleSend(s)}
                className="rounded-xl border border-border bg-surface p-3 active:opacity-70"
              >
                <Text className="text-text">{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          entries.map((e, i) => (
            <View
              key={i}
              className={
                e.role === "user"
                  ? "max-w-[85%] self-end rounded-2xl bg-primary px-3 py-2"
                  : "max-w-[85%] self-start rounded-2xl bg-surface2 px-3 py-2"
              }
            >
              <Text className={e.role === "user" ? "text-white" : "text-text"}>
                {e.text}
              </Text>
            </View>
          ))
        )}
        {loading ? (
          <View className="self-start rounded-2xl bg-surface2 px-3 py-2">
            <Text className="text-muted">Thinking…</Text>
          </View>
        ) : null}
      </ScrollView>

      {voice.error ? (
        <Text className="px-4 text-sm text-danger">{voice.error}</Text>
      ) : null}
      {player.error ? (
        <Text className="px-4 text-sm text-danger">Voice reply: {player.error}</Text>
      ) : null}

      <View className="flex-row items-end gap-2 border-t border-border p-3">
        <View className="flex-1">
          <Input
            value={input}
            onChangeText={setInput}
            placeholder="Ask the assistant…"
            multiline
          />
        </View>
        <Button
          title={voice.recording ? "■" : player.speaking ? "🔊" : "🎤"}
          variant="secondary"
          disabled={player.speaking}
          onPress={handleMic}
        />
        <Button title="Send" loading={loading} onPress={() => handleSend(input)} />
      </View>

      <ConfirmSheet
        visible={!!pending}
        title="Confirm this action?"
        description={
          pending?.content ??
          "Settlr will run this action on the backend once you confirm."
        }
        rows={
          pending
            ? [
                { label: "Action", value: pending.action.tool.replace(/_/g, " ") },
                {
                  label: "Details",
                  value: formatActionDetails(pending.action.tool, pending.action.arguments),
                },
              ]
            : []
        }
        confirmLabel="Confirm & execute"
        loading={confirming}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </KeyboardAvoidingView>
  );
}
