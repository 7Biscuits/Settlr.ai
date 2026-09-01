import React, { useState } from "react";
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
import {
  parseInviteName,
  resolveInviteContacts,
} from "../../src/features/ai/inviteIntent";
import { ContactChooser } from "../../src/features/ai/ContactChooser";
import { buildInviteMessage, sendInviteSms } from "../../src/lib/invites";
import { useAuth } from "../../src/auth/AuthContext";
import type { DeviceContact } from "../../src/lib/contacts";
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

/** Finds the id of the last assistant tool call in the conversation. */
function extractToolCallId(messages: unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as {
      role?: string;
      tool_calls?: { id: string }[];
    };
    if (m?.role === "assistant" && m.tool_calls && m.tool_calls.length > 0) {
      return m.tool_calls[m.tool_calls.length - 1]!.id;
    }
  }
  return "";
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const voice = useVoiceRecorder();

  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<unknown[] | undefined>();

  // Backend-proposed sensitive action awaiting confirmation.
  const [pending, setPending] = useState<{
    action: PendingAction;
    messages: unknown[];
    content: string;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Local voice-invite resolution (device contacts, native SMS).
  const [inviteMatches, setInviteMatches] = useState<DeviceContact[] | null>(
    null,
  );
  const [inviteContext, setInviteContext] = useState<string>("");

  function pushAssistant(text: string) {
    setEntries((e) => [...e, { role: "assistant", text }]);
  }

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    setEntries((e) => [...e, { role: "user", text: trimmed }]);

    // Voice/text invite is handled on-device (contacts + native messaging).
    // Group membership itself still goes through the backend when the user
    // adds the resolved person; here we launch the native invite.
    const inviteName = parseInviteName(trimmed);
    if (inviteName) {
      await handleInvite(inviteName, trimmed);
      return;
    }

    setLoading(true);
    try {
      const reply = await chat(trimmed, conversation);
      applyReply(reply);
    } catch (err) {
      pushAssistant(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  function applyReply(reply: AgentReply) {
    setConversation(reply.messages);
    if (reply.type === "confirmation_required" && reply.pendingAction) {
      setPending({
        action: reply.pendingAction,
        messages: reply.messages,
        content: reply.content,
      });
      if (reply.content) pushAssistant(reply.content);
    } else {
      pushAssistant(reply.content);
    }
  }

  async function handleConfirm() {
    if (!pending) return;
    setConfirming(true);
    try {
      const toolCallId = extractToolCallId(pending.messages);
      const reply = await confirm(
        pending.action.tool,
        pending.action.arguments,
        toolCallId,
        pending.messages,
      );
      setPending(null);
      applyReply(reply);
    } catch (err) {
      setPending(null);
      pushAssistant(
        err instanceof ApiError ? err.message : "The action could not be completed.",
      );
    } finally {
      setConfirming(false);
    }
  }

  async function handleInvite(name: string, original: string) {
    setInviteContext(original);
    try {
      const { matches } = await resolveInviteContacts(name);
      if (matches.length === 0) {
        pushAssistant(
          `I couldn't find "${name}" in your contacts. You can add them by email from the group screen.`,
        );
        return;
      }
      if (matches.length === 1) {
        await launchInvite(matches[0]!);
      } else {
        // Multiple people share the name — ask the user to choose.
        pushAssistant(
          `You have multiple contacts named "${name}". Choose which one to invite.`,
        );
        setInviteMatches(matches);
      }
    } catch {
      pushAssistant("I couldn't access contacts for the invitation.");
    }
  }

  async function launchInvite(contact: DeviceContact) {
    setInviteMatches(null);
    if (contact.phoneNumbers.length === 0) {
      pushAssistant(
        `${contact.name} has no phone number saved, so I can't send an SMS invite.`,
      );
      return;
    }
    const message = buildInviteMessage(user?.name ?? "A friend", "PayPilot");
    const result = await sendInviteSms(contact.phoneNumbers, message);
    if (result === "sent") {
      pushAssistant(`Invitation sent to ${contact.name}.`);
    } else if (result === "unavailable") {
      pushAssistant("This device can't send SMS, so the invite wasn't sent.");
    } else {
      pushAssistant(`Invitation to ${contact.name} was cancelled.`);
    }
  }

  async function handleMic() {
    if (voice.recording) {
      const uri = await voice.stop();
      if (!uri) return;
      // STT stays a backend concern: we upload the clip and the backend (which
      // holds the provider key) returns only the transcript. We never call an
      // LLM/STT provider from the client.
      setLoading(true);
      try {
        const audioBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const mimeType = mimeTypeForUri(uri);
        const { text } = await transcribe(audioBase64, mimeType);
        const trimmed = text.trim();
        if (!trimmed) {
          pushAssistant("I couldn't hear anything. Please try again.");
          return;
        }
        await handleSend(trimmed);
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
          Ask about balances or say “Settle everything I owe Rahul.”
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 10 }}
      >
        {entries.length === 0 ? (
          <View className="gap-2">
            {[
              "How much do I owe Rahul?",
              "Who owes me?",
              "Settle everything I owe Rahul",
              "Invite Rahul to the group",
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
          title={voice.recording ? "■" : "🎤"}
          variant="secondary"
          onPress={handleMic}
        />
        <Button title="Send" loading={loading} onPress={() => handleSend(input)} />
      </View>

      <ConfirmSheet
        visible={!!pending}
        title="Confirm this action?"
        description={
          pending?.content ??
          "PayPilot will run this action on the backend once you confirm."
        }
        rows={
          pending
            ? [
                { label: "Action", value: pending.action.tool },
                {
                  label: "Details",
                  value: JSON.stringify(pending.action.arguments),
                },
              ]
            : []
        }
        confirmLabel="Confirm & execute"
        loading={confirming}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />

      <ContactChooser
        visible={!!inviteMatches}
        contacts={inviteMatches ?? []}
        onSelect={launchInvite}
        onCancel={() => setInviteMatches(null)}
      />
    </KeyboardAvoidingView>
  );
}
