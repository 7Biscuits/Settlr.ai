import React, { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listConversations, initiateConversation } from "../../../src/api/messages";
import type { ConversationSummary, ContactMatchUser } from "../../../src/api/types";
import { useMessageEvents } from "../../../src/features/messages/useMessageEvents";
import { Card } from "../../../src/components/Card";
import { Button } from "../../../src/components/Button";
import { Input } from "../../../src/components/Input";
import { LoadingState, ErrorState, EmptyState } from "../../../src/components/States";
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

  // Hook into real-time events to reload conversations instantly when new message arrives
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

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between border-b border-border p-4">
        <Text className="text-2xl font-bold text-text">Messages</Text>
        <Button
          title="+ New Chat"
          onPress={() => setLookupOpen(true)}
          loading={startingChat}
        />
      </View>

      <View className="p-4 pb-2">
        <Input
          placeholder="Filter conversations..."
          value={filterQuery}
          onChangeText={setFilterQuery}
        />
      </View>

      {error ? (
        <View className="px-4">
          <ErrorState message={error} onRetry={load} />
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor="#3b82f6"
          />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            subtitle="Start a direct chat with any registered PayPilot user or contact."
          />
        ) : (
          filtered.map((conv) => (
            <Pressable
              key={conv.id}
              onPress={() => router.push(`/(app)/messages/${conv.id}`)}
            >
              <Card className="flex-row items-center justify-between bg-surface2 active:opacity-80">
                <View className="flex-1 flex-row items-center gap-3">
                  {conv.otherParticipant.avatarUrl ? (
                    <Image
                      source={{ uri: conv.otherParticipant.avatarUrl }}
                      className="h-12 w-12 rounded-full bg-surface"
                    />
                  ) : (
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                      <Text className="text-lg font-bold text-primary">
                        {conv.otherParticipant.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-semibold text-text" numberOfLines={1}>
                        {conv.otherParticipant.name}
                      </Text>
                      <Text className="text-xs text-muted">
                        {formatTimestamp(conv.lastMessageAt)}
                      </Text>
                    </View>
                    <Text
                      className={`text-sm ${
                        conv.unreadCount > 0 ? "font-semibold text-text" : "text-muted"
                      }`}
                      numberOfLines={1}
                    >
                      {conv.lastMessagePreview ?? "No messages yet"}
                    </Text>
                  </View>
                </View>

                {conv.unreadCount > 0 ? (
                  <View className="ml-2 h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-1.5">
                    <Text className="text-xs font-bold text-white">
                      {conv.unreadCount}
                    </Text>
                  </View>
                ) : null}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>

      <UserLookupModal
        visible={lookupOpen}
        title="Start Conversation"
        onSelect={handleStartChat}
        onCancel={() => setLookupOpen(false)}
      />
    </View>
  );
}
