import React, { useCallback, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

import {
  cancelGroupInvitation,
  getGroup,
  listGroupInvitations,
  removeMember,
  updateGroup,
  deleteGroup,
  leaveGroup,
} from "../../../../src/api/groups";
import { listExpenses } from "../../../../src/api/expenses";
import { getGroupBalances } from "../../../../src/api/balances";
import type {
  DirectedBalance,
  Expense,
  GroupDetail,
  GroupInvitation,
  GroupMember,
} from "../../../../src/api/types";
import { useAuth } from "../../../../src/auth/AuthContext";
import { ConfirmSheet } from "../../../../src/components/ConfirmSheet";
import { StatusBadge } from "../../../../src/components/StatusBadge";
import { LoadingState } from "../../../../src/components/States";
import { formatAmount, formatAbsAmount } from "../../../../src/lib/money";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);

  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<DirectedBalance[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managementError, setManagementError] = useState<string | null>(null);

  // Rename Group State
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Actions State
  const [pendingAction, setPendingAction] = useState<
    | { type: "remove_member"; member: GroupMember }
    | { type: "cancel_invitation"; invitation: GroupInvitation }
    | { type: "delete_group" }
    | { type: "leave_group" }
    | null
  >(null);
  const [managing, setManaging] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const d = await getGroup(id);
      const isOwner = d.group.createdBy === user?.id;
      const [e, b, invitationResult] = await Promise.all([
        listExpenses(id),
        getGroupBalances(id),
        isOwner ? listGroupInvitations(id) : Promise.resolve({ invitations: [] }),
      ]);
      setDetail(d);
      setNewName(d.group.name);
      setExpenses(e.expenses);
      setBalances(b.balances);
      setInvitations(invitationResult.invitations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <LoadingState label="Loading group..." />;
  if (!detail) return <Text style={styles.errorText}>Group not found</Text>;
  const isOwner = detail.group.createdBy === user?.id;

  async function handleRename() {
    if (!id || !newName.trim()) return;
    setRenaming(true);
    setManagementError(null);
    try {
      const updated = await updateGroup(id, newName.trim());
      setDetail((prev) => (prev ? { ...prev, group: updated.group } : null));
      setRenameOpen(false);
    } catch (err) {
      setManagementError(err instanceof Error ? err.message : "Failed to rename group");
    } finally {
      setRenaming(false);
    }
  }

  async function confirmManagementAction() {
    if (!id || !pendingAction) return;
    setManaging(true);
    setManagementError(null);
    try {
      if (pendingAction.type === "remove_member") {
        await removeMember(id, pendingAction.member.id);
        setPendingAction(null);
        await load();
      } else if (pendingAction.type === "cancel_invitation") {
        await cancelGroupInvitation(id, pendingAction.invitation.id);
        setPendingAction(null);
        await load();
      } else if (pendingAction.type === "delete_group") {
        await deleteGroup(id);
        setPendingAction(null);
        router.replace("/(app)/groups");
      } else if (pendingAction.type === "leave_group") {
        await leaveGroup(id);
        setPendingAction(null);
        router.replace("/(app)/groups");
      }
    } catch (err) {
      setManagementError(
        err instanceof Error ? err.message : "Group management action failed",
      );
      setPendingAction(null);
    } finally {
      setManaging(false);
    }
  }

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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {detail.group.name.toUpperCase()}
            </Text>
            {isOwner ? (
              <Pressable
                hitSlop={14}
                onPress={() => {
                  setNewName(detail.group.name);
                  setRenameOpen(true);
                }}
                style={styles.renamePill}>
                <Feather name="edit-2" size={16} color="#0F172A" />
              </Pressable>
            ) : (
              <Pressable
                hitSlop={14}
                onPress={() => setPendingAction({ type: "leave_group" })}
                style={styles.leavePill}>
                <Text style={styles.leavePillText}>Leave</Text>
              </Pressable>
            )}
          </View>

          {/* Quick Action Row */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => router.push(`/(app)/groups/${id}/add-expense`)}
              style={styles.actionButtonPrimary}>
              <Feather name="plus" size={18} color="#0F172A" />
              <Text style={styles.actionButtonTextPrimary}>Add Expense</Text>
            </Pressable>

            {isOwner ? (
              <Pressable
                onPress={() => router.push(`/(app)/groups/${id}/add-member`)}
                style={styles.actionButtonSecondary}>
                <Feather name="user-plus" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonTextSecondary}>Invite Friend</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Bottom Details Card */}
        <View style={[styles.bottomCard, { paddingBottom: bottomInset }]}>
          {managementError ? (
            <Text style={styles.errorBanner}>{managementError}</Text>
          ) : null}

          {/* Balances Section */}
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionTitle}>OUTSTANDING BALANCES</Text>
            {balances.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Everyone in this group is settled up! 🎉</Text>
              </View>
            ) : (
              <View style={styles.balancesList}>
                {balances.map((b) => (
                  <View key={b.otherUserId} style={styles.balanceItem}>
                    <Text style={styles.balanceName}>{b.otherUserName}</Text>
                    <Text
                      style={[
                        styles.balanceAmount,
                        b.netAmount >= 0 ? styles.posAmount : styles.negAmount,
                      ]}>
                      {b.netAmount >= 0
                        ? `owes you ${formatAbsAmount(b.netAmount)}`
                        : `you owe ${formatAbsAmount(b.netAmount)}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Expenses Section */}
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionTitle}>GROUP EXPENSES</Text>
            {expenses.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No expenses logged yet in this group.</Text>
              </View>
            ) : (
              <View style={styles.expensesList}>
                {expenses.map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => router.push(`/(app)/expense/${e.id}`)}
                    style={styles.expenseCard}>
                    <View style={styles.expenseLeft}>
                      <Text style={styles.expenseTitle}>{e.description}</Text>
                      <View style={styles.expenseMeta}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>
                            {e.category || "general"}
                          </Text>
                        </View>
                        <Text style={styles.splitSub}>{e.splitType} split</Text>
                      </View>
                    </View>
                    <Text style={styles.expenseAmount}>{formatAmount(e.amount)}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Members List */}
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionTitle}>MEMBERS ({detail.members.length})</Text>
            <View style={styles.membersList}>
              {detail.members.map((m) => (
                <View key={m.id} style={styles.memberRow}>
                  <View style={styles.memberLeft}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitial}>
                        {(m.name[0] || "U").toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <Text style={styles.memberEmail}>{m.email}</Text>
                    </View>
                  </View>

                  {isOwner && m.id !== detail.group.createdBy ? (
                    <Pressable
                      onPress={() => setPendingAction({ type: "remove_member", member: m })}
                      style={styles.removeButton}>
                      <Feather name="trash-2" size={16} color="#DC2626" />
                    </Pressable>
                  ) : (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {m.id === detail.group.createdBy ? "OWNER" : "MEMBER"}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Danger Zone */}
          {isOwner ? (
            <View style={styles.dangerCard}>
              <Text style={styles.dangerTitle}>GROUP SETTINGS</Text>
              <Text style={styles.dangerDesc}>
                Delete this group and cancel active tracking.
              </Text>
              <Pressable
                onPress={() => setPendingAction({ type: "delete_group" })}
                style={styles.deleteGroupButton}>
                <Text style={styles.deleteGroupText}>Delete Group</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Rename Modal */}
      <Modal
        visible={renameOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRenameOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Group</Text>
              <Pressable onPress={() => setRenameOpen(false)}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Summer Vacation"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
            <Pressable
              onPress={handleRename}
              disabled={renaming || !newName.trim()}
              style={styles.saveModalButton}>
              <Text style={styles.saveModalButtonText}>
                {renaming ? "Saving..." : "Save Name"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Confirmation Sheet */}
      <ConfirmSheet
        visible={!!pendingAction}
        title={
          pendingAction?.type === "remove_member"
            ? "Remove member?"
            : pendingAction?.type === "cancel_invitation"
              ? "Cancel invitation?"
              : pendingAction?.type === "delete_group"
                ? "Delete group?"
                : "Leave group?"
        }
        description={
          pendingAction?.type === "remove_member"
            ? "This removes the member from this group."
            : pendingAction?.type === "delete_group"
              ? "Are you sure you want to delete this group? All balances must be settled."
              : "Are you sure you want to leave this group?"
        }
        rows={
          pendingAction?.type === "remove_member"
            ? [{ label: "Member", value: pendingAction.member.name }]
            : [{ label: "Group", value: detail.group.name }]
        }
        confirmLabel={
          pendingAction?.type === "remove_member"
            ? "Remove member"
            : pendingAction?.type === "delete_group"
              ? "Delete group"
              : "Leave group"
        }
        destructive
        loading={managing}
        onConfirm={confirmManagementAction}
        onCancel={() => setPendingAction(null)}
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
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  renamePill: {
    backgroundColor: "#00F58D",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  leavePill: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  leavePillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#00F58D",
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionButtonTextPrimary: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionButtonTextSecondary: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  bottomCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    flex: 1,
    gap: 20,
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
  errorText: {
    color: "#DC2626",
    textAlign: "center",
    marginTop: 40,
  },
  sectionWrapper: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  emptyBox: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13.5,
    fontWeight: "500",
  },
  balancesList: {
    gap: 8,
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  balanceName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: "800",
  },
  posAmount: {
    color: "#059669",
  },
  negAmount: {
    color: "#DC2626",
  },
  expensesList: {
    gap: 10,
  },
  expenseCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
  },
  expenseLeft: {
    flex: 1,
    gap: 4,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  expenseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: "#2738F5",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  splitSub: {
    fontSize: 12,
    color: "#64748B",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginLeft: 8,
  },
  membersList: {
    gap: 10,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2738F5",
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitial: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  memberName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  memberEmail: {
    fontSize: 12,
    color: "#64748B",
  },
  removeButton: {
    padding: 8,
  },
  roleBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
  },
  dangerCard: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 18,
    padding: 16,
    gap: 8,
    marginTop: 10,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#991B1B",
  },
  dangerDesc: {
    fontSize: 12.5,
    color: "#7F1D1D",
  },
  deleteGroupButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  deleteGroupText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
  },
  saveModalButton: {
    backgroundColor: "#2738F5",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  saveModalButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
