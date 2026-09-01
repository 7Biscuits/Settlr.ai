import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

import { inviteOrAddMember } from "../../../../src/api/groups";
import { ContactPicker } from "../../../../src/features/contacts/ContactPicker";
import type { DeviceContact } from "../../../../src/lib/contacts";
import { ApiError } from "../../../../src/api/client";
import { useAuth } from "../../../../src/auth/AuthContext";
import { buildInviteMessage, sendInviteSms } from "../../../../src/lib/invites";

export default function AddMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<DeviceContact | null>(null);

  function onPickContact(contact: DeviceContact) {
    setPickerOpen(false);
    setSelectedContact(contact);
    if (contact.emails[0]) {
      setEmail(contact.emails[0]);
      setInfo(`Using ${contact.name}'s email.`);
    } else {
      setInfo(
        `${contact.name} has no email saved. Enter their Settlr email to add them.`,
      );
    }
  }

  async function submit() {
    if (!id || !email.trim()) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const result = await inviteOrAddMember(id, email.trim());
      if (result.kind === "member_added") {
        router.back();
        return;
      }

      const { invitation } = result;
      if (selectedContact?.phoneNumbers.length) {
        const delivery = await sendInviteSms(
          selectedContact.phoneNumbers,
          buildInviteMessage(
            user?.name ?? "A friend",
            invitation.groupName,
            invitation.inviteUrl,
          ),
        );
        setInfo(
          delivery === "sent"
            ? `Invitation sent to ${selectedContact.name}.`
            : `Invitation created for ${invitation.email}. Share this link: ${invitation.inviteUrl}`,
        );
      } else {
        setInfo(
          `Invitation created for ${invitation.email}. Share this link: ${invitation.inviteUrl}`,
        );
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to add member",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Top Header Section */}
        <View style={[styles.topSection, { paddingTop: topInset + 4 }]}>
          <View style={styles.headerRow}>
            <Pressable hitSlop={14} onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>INVITE FRIEND</Text>
            <View style={styles.iconButton} />
          </View>
        </View>

        {/* Content Card */}
        <View style={styles.bottomCard}>
          <View style={styles.inputCard}>
            <Text style={styles.cardHeader}>INVITE BY EMAIL</Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="friend@settlr.ai"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />

            <Pressable
              onPress={() => setPickerOpen(true)}
              style={styles.pickContactButton}>
              <Ionicons name="people-outline" size={18} color="#2738F5" />
              <Text style={styles.pickContactText}>Pick from in-app contacts</Text>
            </Pressable>

            {info ? <Text style={styles.infoBanner}>{info}</Text> : null}
            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            <Pressable
              onPress={submit}
              disabled={loading || !email.trim()}
              style={[
                styles.submitButton,
                (!email.trim() || loading) && styles.submitButtonDisabled,
              ]}>
              <Text style={styles.submitButtonText}>
                {loading ? "Inviting..." : "Add to Group 👉"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <ContactPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onPickContact}
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
  },
  inputCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
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
  pickContactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 12,
    borderRadius: 12,
  },
  pickContactText: {
    color: "#2738F5",
    fontSize: 14,
    fontWeight: "700",
  },
  infoBanner: {
    backgroundColor: "#EFF6FF",
    color: "#1E3A8A",
    fontSize: 13,
    fontWeight: "600",
    padding: 10,
    borderRadius: 10,
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
  submitButton: {
    backgroundColor: "#2738F5",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  submitButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
