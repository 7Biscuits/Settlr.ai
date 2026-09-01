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
import { useVoicePlayer } from "../../src/features/ai/useVoicePlayer";
import {
  parseGroupInviteIntent,
  resolveInviteContacts,
  type GroupInviteIntent,
} from "../../src/features/ai/inviteIntent";
import { ContactChooser } from "../../src/features/ai/ContactChooser";
import type { DeviceContact } from "../../src/lib/contacts";
import { buildInviteMessage, sendInviteSms } from "../../src/lib/invites";
import { useAuth } from "../../src/auth/AuthContext";
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

interface InvitationDelivery {
  contact: DeviceContact;
  groupName: string;
}

/** Reads the verified invite result returned by the backend tool message. */
function extractInvitationResult(messages: unknown[]): {
  kind: "member_added" | "invitation_created" | "invitation_existing";
  member?: { name: string; email: string };
  invitation?: { groupName: string; email: string; inviteUrl: string };
} | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i] as { role?: string; content?: string };
    if (message.role !== "tool" || !message.content) continue;
    try {
      const result = JSON.parse(message.content) as {
        success?: boolean;
        data?: {
          kind?: "member_added" | "invitation_created" | "invitation_existing";
          member?: { name: string; email: string };
          invitation?: { groupName: string; email: string; inviteUrl: string };
        };
      };
      if (result.success && result.data?.kind) return result.data as NonNullable<ReturnType<typeof extractInvitationResult>>;
    } catch {
      // Ignore unrelated tool results in the assistant conversation.
    }
  }
  return null;
}

export default function AssistantScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const voice = useVoiceRecorder();
  const player = useVoicePlayer();

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
  const [contactMatches, setContactMatches] = useState<DeviceContact[] | null>(null);
  const [inviteIntent, setInviteIntent] = useState<GroupInviteIntent | null>(null);
  const [inviteSpeakReply, setInviteSpeakReply] = useState(false);
  const [pendingDelivery, setPendingDelivery] = useState<InvitationDelivery | null>(null);

  function pushAssistant(text: string) {
    setEntries((e) => [...e, { role: "assistant", text }]);
  }

  async function handleSend(text: string, speakReply = false) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    setEntries((e) => [...e, { role: "user", text: trimmed }]);

    const intent = parseGroupInviteIntent(trimmed);
    if (intent) {
      await resolveGroupInvite(intent, speakReply);
      return;
    }

    await sendToBackend(trimmed, undefined, speakReply);
  }

  async function sendToBackend(
    message: string,
    delivery?: InvitationDelivery,
    speakReply = false,
  ) {
    setLoading(true);
    try {
      const reply = await chat(message, conversation);
      if (
        delivery &&
        reply.type === "confirmation_required" &&
        reply.pendingAction?.tool === "invite_to_group"
      ) {
        setPendingDelivery(delivery);
      }
      await applyReply(reply, speakReply);
    } catch (err) {
      pushAssistant(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function resolveGroupInvite(intent: GroupInviteIntent, speakReply: boolean) {
    setInviteIntent(intent);
    setInviteSpeakReply(speakReply);
    try {
      const { matches } = await resolveInviteContacts(intent.contactName);
      if (matches.length === 0) {
        pushAssistant(
          `I couldn't find ${intent.contactName} in your contacts. Choose a contact from the group screen or ask again with their PayPilot email.`,
        );
      } else if (matches.length === 1) {
        await beginInvite(matches[0]!, intent, speakReply);
      } else {
        pushAssistant(`Choose which ${intent.contactName} you want to invite.`);
        setContactMatches(matches);
      }
    } catch {
      pushAssistant("I couldn't access contacts. Check contacts permission and try again.");
    }
  }

  async function beginInvite(
    contact: DeviceContact,
    intent = inviteIntent,
    speakReply = inviteSpeakReply,
  ) {
    setContactMatches(null);
    if (!intent) return;
    const email = contact.emails[0]?.trim();
    if (!email) {
      pushAssistant(
        `${contact.name} has no email saved. Group invitations are email-bound, so add their email to Contacts or use the group screen to enter it.`,
      );
      return;
    }
    const backendRequest = `Invite ${contact.name} with email ${email} to the ${intent.groupName} group. Use the invite_to_group tool after resolving the group. This requires confirmation.`;
    await sendToBackend(
      backendRequest,
      { contact, groupName: intent.groupName },
      speakReply,
    );
  }

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

  async function handleConfirm() {
    if (!pending) return;
    setConfirming(true);
    try {
      const speakReply = pending.speakReply;
      const reply = await confirm(pending.action.proposalId);
      setPending(null);
      await applyReply(reply, speakReply);
      const invite = extractInvitationResult(reply.messages);
      if (pendingDelivery && invite) {
        if (invite.kind === "member_added") {
          pushAssistant(`${invite.member?.name ?? pendingDelivery.contact.name} is now a member of the group.`);
        } else if (invite.invitation) {
          if (pendingDelivery.contact.phoneNumbers.length === 0) {
            pushAssistant(`Invitation created for ${invite.invitation.email}. This contact has no phone number; share this link: ${invite.invitation.inviteUrl}`);
            setPendingDelivery(null);
            return;
          }
          const outcome = await sendInviteSms(
            pendingDelivery.contact.phoneNumbers,
            buildInviteMessage(
              user?.name ?? "A friend",
              invite.invitation.groupName,
              invite.invitation.inviteUrl,
            ),
          );
          if (outcome === "sent") {
            pushAssistant(`The invitation link was sent to ${pendingDelivery.contact.name}.`);
          } else if (outcome === "unavailable") {
            pushAssistant(`Invitation created for ${invite.invitation.email}. This device cannot send SMS; share this link: ${invite.invitation.inviteUrl}`);
          } else {
            pushAssistant(`Invitation created for ${invite.invitation.email}. Sending was cancelled; share this link: ${invite.invitation.inviteUrl}`);
          }
        }
      }
      setPendingDelivery(null);
    } catch (err) {
      setPending(null);
      setPendingDelivery(null);
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
      // STT stays a backend concern: we upload the clip and the backend (which
      // holds the provider key) returns only the transcript. We never call an
      // LLM/STT provider from the client.
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
        onCancel={() => {
          setPending(null);
          setPendingDelivery(null);
        }}
      />

      <ContactChooser
        visible={!!contactMatches}
        contacts={contactMatches ?? []}
        onSelect={(contact) => void beginInvite(contact)}
        onCancel={() => setContactMatches(null)}
      />

    </KeyboardAvoidingView>
  );
}
