import React, { useCallback, useState } from "react";
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { Card } from "../../../../src/components/Card";
import { Button } from "../../../../src/components/Button";
import { Input } from "../../../../src/components/Input";
import { ConfirmSheet } from "../../../../src/components/ConfirmSheet";
import { StatusBadge } from "../../../../src/components/StatusBadge";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../../../src/components/States";
import { formatAmount, formatAbsAmount } from "../../../../src/lib/money";

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

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
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!detail) return <ErrorState message="Group not found" />;
  const isOwner = detail.group.createdBy === user?.id;

  async function handleRename() {
    if (!id || !newName.trim()) return;
    setRenaming(true);
    setManagementError(null);
    try {
      const updated = await updateGroup(id, newName.trim());
      setDetail((prev) => prev ? { ...prev, group: updated.group } : null);
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

  return (
    <ScrollView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
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
      {/* Top Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <Button title="←" variant="ghost" onPress={() => router.back()} />
            <Text className="text-sm text-muted">Group</Text>
          </View>
          <Text className="text-2xl font-bold text-text pl-2">
            {detail.group.name}
          </Text>
        </View>
        {isOwner ? (
          <Button
            title="Rename"
            variant="secondary"
            onPress={() => {
              setNewName(detail.group.name);
              setRenameOpen(true);
            }}
          />
        ) : (
          <Button
            title="Leave"
            variant="danger"
            onPress={() => setPendingAction({ type: "leave_group" })}
          />
        )}
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button
            title="Add expense"
            onPress={() => router.push(`/(app)/groups/${id}/add-expense`)}
          />
        </View>
        {isOwner ? (
          <View className="flex-1">
            <Button
              title="Add member"
              variant="secondary"
              onPress={() => router.push(`/(app)/groups/${id}/add-member`)}
            />
          </View>
        ) : null}
      </View>

      {managementError ? (
        <Card className="border-danger/40 bg-danger/10">
          <Text className="text-sm text-danger">{managementError}</Text>
        </Card>
      ) : null}

      {/* Members Section */}
      <View className="gap-2">
        <Text className="text-lg font-semibold text-text">Members</Text>
        <Card>
          {detail.members.map((m) => (
            <View
              key={m.id}
              className="flex-row items-center justify-between border-b border-border py-2.5 last:border-0"
            >
              <View className="flex-1 gap-0.5">
                <Text className="text-text font-medium">{m.name}</Text>
                <Text className="text-xs text-muted">{m.email}</Text>
                <Text className="text-[10px] uppercase font-bold text-muted">
                  {m.role ?? (m.id === detail.group.createdBy ? "owner" : "member")}
                </Text>
              </View>
              {isOwner && m.id !== detail.group.createdBy ? (
                <Button
                  title="Remove"
                  variant="danger"
                  onPress={() => setPendingAction({ type: "remove_member", member: m })}
                />
              ) : null}
            </View>
          ))}
        </Card>
      </View>

      {/* Invitations Section */}
      {isOwner ? (
        <View className="gap-2">
          <Text className="text-lg font-semibold text-text">Invitations</Text>
          {invitations.length === 0 ? (
            <Card>
              <Text className="text-sm text-muted">No invitations have been sent.</Text>
            </Card>
          ) : (
            invitations.map((invitation) => (
              <Card key={invitation.id}>
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-text">{invitation.email}</Text>
                    <StatusBadge status={invitation.status} />
                  </View>
                  {invitation.status === "pending" ? (
                    <Button
                      title="Cancel"
                      variant="danger"
                      onPress={() => setPendingAction({ type: "cancel_invitation", invitation })}
                    />
                  ) : null}
                </View>
              </Card>
            ))
          )}
        </View>
      ) : null}

      {/* Balances Section */}
      <View className="gap-2">
        <Text className="text-lg font-semibold text-text">Balances</Text>
        {balances.length === 0 ? (
          <Card>
            <Text className="text-sm text-muted">Everyone is settled up.</Text>
          </Card>
        ) : (
          balances.map((b) => (
            <Card key={b.otherUserId}>
              <View className="flex-row items-center justify-between">
                <Text className="text-text font-medium">{b.otherUserName}</Text>
                <Text
                  className={
                    b.netAmount >= 0
                      ? "font-semibold text-success"
                      : "font-semibold text-danger"
                  }
                >
                  {b.netAmount >= 0
                    ? `owes you ${formatAbsAmount(b.netAmount)}`
                    : `you owe ${formatAbsAmount(b.netAmount)}`}
                </Text>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Expenses Section */}
      <View className="gap-2">
        <Text className="text-lg font-semibold text-text">Expenses</Text>
        {expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            subtitle="Add the first shared expense for this group."
          />
        ) : (
          expenses.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => router.push(`/(app)/expense/${e.id}`)}
            >
              <Card className="flex-row items-center justify-between bg-surface2 active:opacity-80">
                <View className="gap-1 flex-1">
                  <Text className="text-base font-medium text-text">{e.description}</Text>
                  <View className="flex-row items-center gap-2">
                    <View className="rounded bg-primary/20 px-1.5 py-0.5">
                      <Text className="text-[10px] font-bold uppercase text-primary">
                        {e.category ?? "general"}
                      </Text>
                    </View>
                    <Text className="text-xs text-muted capitalize">
                      {e.splitType} split
                    </Text>
                    {e.receiptUrl ? (
                      <Text className="text-xs text-muted">📎 Receipt</Text>
                    ) : null}
                  </View>
                </View>
                <Text className="text-base font-bold text-text">
                  {formatAmount(e.amount)}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </View>

      {/* Owner Actions: Delete Group */}
      {isOwner ? (
        <Card className="gap-2 border-danger/30 bg-surface2">
          <Text className="text-base font-semibold text-text">Danger Zone</Text>
          <Text className="text-xs text-muted">
            Deleting this group permanently deletes group memberships. All balances must be settled before deleting.
          </Text>
          <Button
            title="Delete group"
            variant="danger"
            onPress={() => setPendingAction({ type: "delete_group" })}
          />
        </Card>
      ) : null}

      {/* Rename Modal */}
      <Modal visible={renameOpen} transparent animationType="slide" onRequestClose={() => setRenameOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl border-t border-border bg-surface p-5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-text">Rename Group</Text>
              <Pressable onPress={() => setRenameOpen(false)} className="p-1">
                <Text className="text-lg text-muted">✕</Text>
              </Pressable>
            </View>
            <Input
              label="Group Name"
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Vacation Trip"
            />
            <Button
              title="Save Name"
              loading={renaming}
              onPress={handleRename}
            />
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
            ? "This removes the member from this group. Their existing expense history stays intact."
            : pendingAction?.type === "cancel_invitation"
              ? "The recipient will no longer be able to use this invitation link."
              : pendingAction?.type === "delete_group"
                ? "Are you sure you want to delete this group? You can only delete when all balances are fully settled."
                : "Are you sure you want to leave this group?"
        }
        rows={
          pendingAction?.type === "remove_member"
            ? [{ label: "Member", value: pendingAction.member.name }]
            : pendingAction?.type === "cancel_invitation"
              ? [{ label: "Email", value: pendingAction.invitation.email }]
              : [{ label: "Group", value: detail.group.name }]
        }
        confirmLabel={
          pendingAction?.type === "remove_member"
            ? "Remove member"
            : pendingAction?.type === "cancel_invitation"
              ? "Cancel invitation"
              : pendingAction?.type === "delete_group"
                ? "Delete group"
                : "Leave group"
        }
        destructive
        loading={managing}
        onConfirm={confirmManagementAction}
        onCancel={() => setPendingAction(null)}
      />
    </ScrollView>
  );
}
