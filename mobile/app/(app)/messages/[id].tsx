import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

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
import { LoadingState } from "../../../src/components/States";

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
  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);

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

  useMessageEvents(
    (newMsg) => {
      if (newMsg.conversationId === id) {
        setMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);
        void markMessagesAsRead(id).catch(() => {});
      }
    },
    () => {
      setMessages((prev) =>
        prev.map((m) => (m.senderId === user?.id ? { ...m, isRead: true } : m)),
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

  const partner = conversation?.otherParticipant;

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}>
        {/* Top Header */}
        <View style={[styles.topHeader, { paddingTop: topInset + 4 }]}>
          <Pressable hitSlop={14} onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>

          <View style={styles.partnerInfo}>
            {partner?.avatarUrl ? (
              <Image source={{ uri: partner.avatarUrl }} style={styles.partnerAvatar} />
            ) : (
              <View style={styles.partnerAvatarFallback}>
                <Text style={styles.partnerInitial}>
                  {(partner?.name || "U")[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.partnerName}>{partner?.name || "Chat"}</Text>
              <Text style={styles.partnerEmail}>{partner?.email}</Text>
            </View>
          </View>

          <View style={styles.iconButton} />
        </View>

        {/* Message Stream */}
        <FlatList
          ref={flatListRef}
          inverted
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            return (
              <View
                style={[
                  styles.messageRow,
                  isMine ? styles.messageRowMine : styles.messageRowOther,
                ]}>
                <View
                  style={[
                    styles.messageBubble,
                    isMine ? styles.bubbleMine : styles.bubbleOther,
                  ]}>
                  {item.messageType !== "text" ? (
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {item.messageType.replace("_", " ")}
                      </Text>
                    </View>
                  ) : null}

                  <Text
                    style={[
                      styles.messageText,
                      isMine ? styles.messageTextMine : styles.messageTextOther,
                    ]}>
                    {item.content}
                  </Text>
                </View>

                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatMessageTime(item.createdAt)}</Text>
                  {isMine ? (
                    <Text style={styles.readStatusText}>
                      {item.isRead ? "✓✓ Read" : "✓"}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }}
        />

        {/* Composer Bar */}
        <View style={styles.composerBar}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            multiline
            style={styles.composerInput}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}>
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#151C8A",
  },
  keyboardView: {
    flex: 1,
    backgroundColor: "#F3F6FB",
  },
  topHeader: {
    backgroundColor: "#151C8A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  partnerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginLeft: 8,
  },
  partnerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2738F5",
  },
  partnerAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2738F5",
    alignItems: "center",
    justifyContent: "center",
  },
  partnerInitial: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  partnerName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  partnerEmail: {
    color: "#CBD5E1",
    fontSize: 12,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    maxWidth: "80%",
    gap: 3,
  },
  messageRowMine: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  messageRowOther: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleMine: {
    backgroundColor: "#2738F5",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  typeBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMine: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  messageTextOther: {
    color: "#0F172A",
    fontWeight: "500",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  timeText: {
    fontSize: 10.5,
    color: "#94A3B8",
  },
  readStatusText: {
    fontSize: 10.5,
    color: "#2738F5",
    fontWeight: "700",
  },
  composerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 8,
  },
  composerInput: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: "#0F172A",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#2738F5",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
});
