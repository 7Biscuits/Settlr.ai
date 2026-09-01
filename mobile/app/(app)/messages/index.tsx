import React, { useCallback, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

import { listConversations, initiateConversation } from "../../../src/api/messages";
import type { ConversationSummary, ContactMatchUser } from "../../../src/api/types";
import { useMessageEvents } from "../../../src/features/messages/useMessageEvents";
import { LoadingState } from "../../../src/components/States";
import { UserLookupModal } from "../../../src/components/UserLookupModal";

function formatTimestamp(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await listConversations();
      setConversations(res.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useMessageEvents(
    () => void load(),
    () => void load(),
  );

  async function handleStartChat(selectedUser: ContactMatchUser) {
    setStartingChat(true);
    try {
      const detail = await initiateConversation({
        recipientId: selectedUser.id,
      });
      setLookupOpen(false);
      router.push(`/(app)/messages/${detail.conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setStartingChat(false);
    }
  }

  const filtered = conversations.filter((c) =>
    c.otherParticipant.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.otherParticipant.email.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  if (loading) return <LoadingState label="Loading messages..." />;

  const bottomInset = Math.max(insets.bottom + 24, Platform.OS === "android" ? 56 : 36);

  return (
    <View style={styles.safeArea}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor="#00F58D"
          />
        }>
        {/* Top Header Section */}
        <View style={[styles.topSection, { paddingTop: topInset + 4 }]}>
          <View style={styles.headerRow}>
            <Pressable hitSlop={14} onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>DIRECT MESSAGES</Text>
            <Pressable
              hitSlop={14}
              onPress={() => setLookupOpen(true)}
              style={styles.plusPill}>
              <Feather name="edit" size={18} color="#0F172A" />
            </Pressable>
          </View>

          {/* Search Box */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              value={filterQuery}
              onChangeText={setFilterQuery}
              placeholder="Search conversations..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Bottom Content Card */}
        <View style={[styles.bottomCard, { paddingBottom: bottomInset }]}>
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <Text style={styles.sectionTitle}>ALL CHATS</Text>

          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No messages yet 💬</Text>
              <Text style={styles.emptySubtitle}>
                Start a direct chat with friends to discuss splits and confirm settlements.
              </Text>
              <Pressable
                onPress={() => setLookupOpen(true)}
                style={styles.newChatButton}>
                <Text style={styles.newChatButtonText}>+ New Conversation</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.chatList}>
              {filtered.map((conv) => (
                <Pressable
                  key={conv.id}
                  onPress={() => router.push(`/(app)/messages/${conv.id}`)}
                  style={styles.chatCard}>
                  <View style={styles.chatLeft}>
                    {conv.otherParticipant.avatarUrl ? (
                      <Image
                        source={{ uri: conv.otherParticipant.avatarUrl }}
                        style={styles.avatarImg}
                      />
                    ) : (
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarInitials}>
                          {conv.otherParticipant.name.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.chatInfo}>
                      <View style={styles.chatTopLine}>
                        <Text style={styles.senderName} numberOfLines={1}>
                          {conv.otherParticipant.name}
                        </Text>
                        <Text style={styles.timestamp}>
                          {formatTimestamp(conv.lastMessageAt)}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.messagePreview,
                          conv.unreadCount > 0 && styles.messagePreviewUnread,
                        ]}
                        numberOfLines={1}>
                        {conv.lastMessagePreview || "No messages yet"}
                      </Text>
                    </View>
                  </View>

                  {conv.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{conv.unreadCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* User Discovery Modal */}
      <UserLookupModal
        visible={lookupOpen}
        title="Start Conversation"
        onSelect={handleStartChat}
        onCancel={() => setLookupOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#151C8A",
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#F3F6FB",
  },
  topSection: {
    backgroundColor: "#151C8A",
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  plusPill: {
    backgroundColor: "#00F58D",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  bottomCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    flex: 1,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  chatList: {
    gap: 12,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 14,
  },
  chatLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2738F5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  senderName: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  timestamp: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  messagePreview: {
    fontSize: 13.5,
    color: "#64748B",
  },
  messagePreviewUnread: {
    color: "#0F172A",
    fontWeight: "700",
  },
  unreadBadge: {
    backgroundColor: "#2738F5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 260,
  },
  newChatButton: {
    backgroundColor: "#2738F5",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  newChatButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
