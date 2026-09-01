import React, { useCallback, useState } from "react";
import {
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

import { listGroups, createGroup } from "../../../src/api/groups";
import type { Group } from "../../../src/api/types";
import { LoadingState } from "../../../src/components/States";

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreateBox, setShowCreateBox] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { groups } = await listGroups();
      setGroups(groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function submit() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createGroup(name.trim());
      setName("");
      setShowCreateBox(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <LoadingState label="Loading groups..." />;

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
            <Text style={styles.headerTitle}>SETTLR GROUPS</Text>
            <Pressable
              hitSlop={14}
              onPress={() => setShowCreateBox((prev) => !prev)}
              style={styles.plusPill}>
              <Feather name={showCreateBox ? "x" : "plus"} size={20} color="#0F172A" />
            </Pressable>
          </View>

          <View style={styles.statsBanner}>
            <Text style={styles.statsCount}>{groups.length}</Text>
            <Text style={styles.statsLabel}>Active Split Groups</Text>
          </View>
        </View>

        {/* Bottom Content Card */}
        <View style={[styles.bottomCard, { paddingBottom: bottomInset }]}>
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          {/* New Group Input Box */}
          {showCreateBox && (
            <View style={styles.createCard}>
              <Text style={styles.createTitle}>CREATE NEW GROUP</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Goa Trip 🏖️ or Flat 402 🏠"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
              <Pressable
                onPress={submit}
                disabled={creating || !name.trim()}
                style={[
                  styles.createButton,
                  (!name.trim() || creating) && styles.createButtonDisabled,
                ]}>
                <Text style={styles.createButtonText}>
                  {creating ? "Creating..." : "Create Group 👉"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Groups List */}
          <Text style={styles.sectionTitle}>YOUR ACTIVE GROUPS</Text>

          {groups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No groups yet 🏝️</Text>
              <Text style={styles.emptySubtitle}>
                Create your first group to start splitting bills and settling debts!
              </Text>
              <Pressable
                onPress={() => setShowCreateBox(true)}
                style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>+ Create Group</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.groupList}>
              {groups.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => router.push(`/(app)/groups/${g.id}`)}
                  style={styles.groupCard}>
                  <View style={styles.groupLeft}>
                    <View style={styles.groupAvatar}>
                      <Text style={styles.groupInitial}>
                        {(g.name[0] || "G").toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.groupName}>{g.name}</Text>
                      <Text style={styles.groupSub}>Tap to view balances & splits</Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color="#94A3B8" />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 24,
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
  statsBanner: {
    alignItems: "center",
    marginVertical: 8,
  },
  statsCount: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  statsLabel: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "700",
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
  createCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    marginBottom: 20,
    gap: 10,
  },
  createTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1E3A8A",
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
  createButton: {
    backgroundColor: "#2738F5",
    borderRadius: 12,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  groupList: {
    gap: 12,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 14,
  },
  groupLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2738F5",
    alignItems: "center",
    justifyContent: "center",
  },
  groupInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  groupName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  groupSub: {
    fontSize: 12.5,
    color: "#64748B",
    marginTop: 2,
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
  emptyButton: {
    backgroundColor: "#2738F5",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
