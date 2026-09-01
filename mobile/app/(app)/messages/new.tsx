import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

import { lookupUser } from "../../../src/api/users";
import { initiateConversation } from "../../../src/api/messages";
import type { ContactMatchUser } from "../../../src/api/types";

export default function NewMessageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedUser, setSearchedUser] = useState<ContactMatchUser | null>(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q) {
      setError("Please enter a name, email, or phone number.");
      return;
    }
    setLoading(true);
    setError(null);
    setSearchedUser(null);
    try {
      const isEmail = q.includes("@");
      const isPhone = /^[+\d\s()-]+$/.test(q);
      const res = await lookupUser({
        email: isEmail ? q : undefined,
        phone: !isEmail && isPhone ? q : undefined,
        query: !isEmail && !isPhone ? q : undefined,
      });
      setSearchedUser(res.user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No registered Settlr user found.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStartConversation(recipientId: string) {
    setStartingChat(true);
    setError(null);
    try {
      const detail = await initiateConversation({ recipientId });
      router.replace(`/(app)/messages/${detail.conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation.");
    } finally {
      setStartingChat(false);
    }
  }

  const bottomInset = Math.max(insets.bottom + 24, Platform.OS === "android" ? 56 : 36);

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={{ flex: 1 }}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={[styles.topSection, { paddingTop: topInset + 4 }]}>

          <View style={styles.headerRow}>
            <Pressable hitSlop={14} onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>NEW CONVERSATION</Text>
            <View style={styles.iconButton} />
          </View>
        </View>

        {/* Content Card */}
        <View style={[styles.bottomCard, { paddingBottom: bottomInset }]}>
          <View style={styles.searchCard}>
            <Text style={styles.searchTitle}>FIND USER OR CONTACT</Text>
            <TextInput
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                if (error) setError(null);
              }}
              placeholder="e.g. Shahil or shahil@settlr.ai"

              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              style={styles.textInput}
            />
            <Pressable
              onPress={handleSearch}
              disabled={loading || !query.trim()}
              style={[
                styles.searchButton,
                (!query.trim() || loading) && styles.searchButtonDisabled,
              ]}>
              <Text style={styles.searchButtonText}>
                {loading ? "Searching..." : "Search Settlr Users 🔍"}
              </Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          {searchedUser ? (
            <View style={styles.userFoundCard}>
              <View style={styles.userLeft}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitial}>
                    {searchedUser.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.userName}>{searchedUser.name}</Text>
                  {searchedUser.email ? (
                    <Text style={styles.userSub}>{searchedUser.email}</Text>
                  ) : null}
                  {searchedUser.phone ? (
                    <Text style={styles.userSub}>{searchedUser.phone}</Text>
                  ) : null}
                </View>
              </View>

              <Pressable
                onPress={() => handleStartConversation(searchedUser.id)}
                disabled={startingChat}
                style={styles.startChatButton}>
                <Text style={styles.startChatButtonText}>
                  {startingChat ? "Opening..." : "Chat 👉"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 8,
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
  bottomCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    flex: 1,
    gap: 16,
  },
  searchCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  searchTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
  },
  searchButton: {
    backgroundColor: "#2738F5",
    borderRadius: 12,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
  },
  userFoundCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    borderRadius: 18,
    padding: 14,
  },
  userLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2738F5",
    alignItems: "center",
    justifyContent: "center",
  },
  userInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  userSub: {
    fontSize: 12,
    color: "#64748B",
  },
  startChatButton: {
    backgroundColor: "#00F58D",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startChatButtonText: {
    color: "#0F172A",
    fontSize: 13.5,
    fontWeight: "800",
  },
});
