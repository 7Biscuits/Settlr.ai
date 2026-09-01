import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getConversation,
  listMessages,
  sendMessage,
  markMessagesAsRead,
} from "../../../src/api/messages";
import type {
  ConversationDetail,
  DirectMessage,
} from "../../../src/api/types";
import { useAuth } from "../../../src/auth/AuthContext";
import { useMessageEvents } from "../../../src/features/messages/useMessageEvents";
import { Input } from "../../../src/components/Input";
import { Button } from "../../../src/components/Button";
import { LoadingState, ErrorState } from "../../../src/components/States";

function formatMessageTime(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DirectMessageChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [conv, msgList] = await Promise.all([
        getConversation(id),
        listMessages(id, { limit: 50 }),
      ]);
      setConversation(conv);
      // listMessages returns messages in descending order (newest first).
      setMessages(msgList.messages);
      await markMessagesAsRead(id).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chat");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Real-time message receiver
  useMessageEvents(
    (newMsg) => {
      if (newMsg.conversationId === id) {
        setMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);
        void markMessagesAsRead(id).catch(() => {});
      }
    },
    (readData) => {
      // If messages were read by partner, update isRead status on our sent messages
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === user?.id ? { ...m, isRead: true } : m,
        ),
      );
    },
  );

  async function handleSend() {
    const text = inputText.trim();
    if (!text || !id || sending) return;
    setInputText("");
    setSending(true);

    try {
      const res = await sendMessage(id, {
        content: text,
        messageType: "text",
      });
      setMessages((prev) => [res.message, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <LoadingState label="Loading conversation..." />;
  if (error && !conversation) return <ErrorState message={error} onRetry={load} />;

  const partner = conversation?.otherParticipant;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border p-3">
        <View className="flex-row items-center gap-3">
          <Button
            title="←"
            variant="ghost"
            onPress={() => router.back()}
          />
          {partner?.avatarUrl ? (
            <Image
              source={{ uri: partner.avatarUrl }}
              className="h-10 w-10 rounded-full bg-surface"
            />
          ) : (
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Text className="text-base font-bold text-primary">
                {partner?.name?.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text className="text-base font-bold text-text">
              {partner?.name ?? "Chat"}
            </Text>
            <Text className="text-xs text-muted">
              {partner?.email}
            </Text>
          </View>
        </View>
      </View>

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        inverted
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => {
          const isMine = item.senderId === user?.id;
          return (
            <View
              className={`max-w-[80%] gap-1 ${
                isMine ? "self-end items-end" : "self-start items-start"
              }`}
            >
              <View
                className={`rounded-2xl px-4 py-2.5 ${
                  isMine ? "bg-primary rounded-tr-sm" : "bg-surface2 rounded-tl-sm"
                }`}
              >
                {item.messageType !== "text" ? (
                  <View className="mb-1 self-start rounded bg-black/30 px-1.5 py-0.5">
                    <Text className="text-[10px] uppercase font-bold text-white tracking-wide">
                      {item.messageType.replace("_", " ")}
                    </Text>
                  </View>
                ) : null}

                <Text className={`text-base ${isMine ? "text-white" : "text-text"}`}>
                  {item.content}
                </Text>

                {item.attachmentUrl ? (
                  <Image
                    source={{ uri: item.attachmentUrl }}
                    className="mt-2 h-40 w-56 rounded-lg bg-black/20"
                    resizeMode="cover"
                  />
                ) : null}
              </View>

              <View className="flex-row items-center gap-1 px-1">
                <Text className="text-[10px] text-muted">
                  {formatMessageTime(item.createdAt)}
                </Text>
                {isMine ? (
                  <Text className="text-[10px] text-muted">
                    {item.isRead ? "✓✓ Read" : "✓ Sent"}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      {/* Composer Input */}
      <View className="flex-row items-end gap-2 border-t border-border p-3">
        <View className="flex-1">
          <Input
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
          />
        </View>
        <Button
          title="Send"
          loading={sending}
          disabled={!inputText.trim()}
          onPress={handleSend}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
