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

import { useAuth } from "../../src/auth/AuthContext";
import { getMeProfile, updateUserProfile } from "../../src/api/users";
import { getHealthStatus } from "../../src/api/health";
import type { HealthStatus } from "../../src/api/types";
import { LoadingState } from "../../src/components/States";

export default function ProfileScreen() {
  const { user, updateUser, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [profileRes, healthRes] = await Promise.all([
        getMeProfile(),
        getHealthStatus().catch(() => ({ status: "degraded", database: "offline", timestamp: "" })),
      ]);
      const u = profileRes.user;
      setName(u.name);
      setPhone(u.phone ?? "");
      setBio(u.bio ?? "");
      setAvatarUrl(u.avatarUrl ?? "");
      updateUser(u);
      setHealth(healthRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSave() {
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await updateUserProfile({
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : null,
        bio: bio.trim() ? bio.trim() : null,
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      });
      updateUser(res.user);
      setEditing(false);
      setSuccessMsg("Profile updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading profile..." />;

  const getInitials = (n: string) => {
    const parts = n.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (n[0] || "U").toUpperCase();
  };

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
        {/* Top Blue Header */}
        <View style={[styles.topSection, { paddingTop: topInset + 4 }]}>
          <View style={styles.headerRow}>
            <Pressable hitSlop={14} onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>USER PROFILE</Text>
            <Pressable
              onPress={() => {
                if (editing) {
                  setName(user?.name ?? "");
                  setPhone(user?.phone ?? "");
                  setBio(user?.bio ?? "");
                  setAvatarUrl(user?.avatarUrl ?? "");
                  setError(null);
                }
                setEditing(!editing);
              }}
              style={styles.editPill}>
              <Text style={styles.editPillText}>{editing ? "Cancel" : "Edit"}</Text>
            </Pressable>
          </View>

          {/* Glowing Avatar */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
              )}
            </View>
            <View style={styles.starBadge}>
              <Ionicons name="sparkles" size={13} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* White Details Container */}
        <View style={styles.bottomCard}>
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
          {successMsg ? <Text style={styles.successBanner}>{successMsg}</Text> : null}

          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>ACCOUNT INFORMATION</Text>

            {editing ? (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your Name"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bio</Text>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Short bio or status"
                    placeholderTextColor="#94A3B8"
                    multiline
                    style={[styles.textInput, styles.bioInput]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Avatar Image URL</Text>
                  <TextInput
                    value={avatarUrl}
                    onChangeText={setAvatarUrl}
                    placeholder="https://example.com/avatar.jpg"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    style={styles.textInput}
                  />
                </View>

                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.infoList}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{user?.phone || "Not set"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bio</Text>
                  <Text style={styles.infoValue}>{user?.bio || "No bio added yet"}</Text>
                </View>
                <View style={styles.infoRowLast}>
                  <Text style={styles.infoLabel}>User ID</Text>
                  <Text style={styles.infoValueMono}>{user?.id}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Backend Health Status */}
          <View style={styles.healthCard}>
            <View style={styles.healthLeft}>
              <View
                style={[
                  styles.healthDot,
                  health?.status === "ok" ? styles.healthOnline : styles.healthOffline,
                ]}
              />
              <Text style={styles.healthTitle}>Server & Database</Text>
            </View>
            <Text style={styles.healthStatus}>
              {health?.status === "ok" ? "Connected ⚡" : "Offline"}
            </Text>
          </View>

          {/* Sign Out Action */}
          <Pressable
            onPress={signOut}
            style={styles.signOutButton}>
            <Text style={styles.signOutText}>Log out of Settlr</Text>
          </Pressable>
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
    alignItems: "center",
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    width: "100%",
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
  editPill: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  editPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  avatarWrapper: {
    position: "relative",
    marginVertical: 10,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#2738F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#00F58D",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
  },
  starBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#00F58D",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#151C8A",
  },
  profileName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 6,
    textTransform: "uppercase",
  },
  profileEmail: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
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
  errorBanner: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
  },
  successBanner: {
    backgroundColor: "#DCFCE7",
    color: "#059669",
    fontSize: 13,
    fontWeight: "600",
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 8,
  },
  infoRowLast: {
    paddingBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  infoValueMono: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#64748B",
    marginTop: 2,
  },
  editForm: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
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
  bioInput: {
    height: 72,
    paddingTop: 10,
  },
  saveButton: {
    backgroundColor: "#2738F5",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  healthCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    padding: 12,
  },
  healthLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthOnline: {
    backgroundColor: "#10B981",
  },
  healthOffline: {
    backgroundColor: "#EF4444",
  },
  healthTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  healthStatus: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
  signOutButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#161A36",
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  signOutText: {
    color: "#161A36",
    fontSize: 15,
    fontWeight: "800",
  },
});
