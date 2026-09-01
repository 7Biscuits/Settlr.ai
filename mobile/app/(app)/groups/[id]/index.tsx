import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  cancelGroupInvitation,
  getGroup,
  listGroupInvitations,
  removeMember,
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
  const [pendingAction, setPendingAction] = useState<
    | { type: "remove_member"; member: GroupMember }
    | { type: "cancel_invitation"; invitation: GroupInvitation }
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

  async function confirmManagementAction() {
    if (!id || !pendingAction) return;
    setManaging(true);
    setManagementError(null);
    try {
      if (pendingAction.type === "remove_member") {
        await removeMember(id, pendingAction.member.id);
      } else {
        await cancelGroupInvitation(id, pendingAction.invitation.id);
      }
      setPendingAction(null);
      await load();
    } catch (err) {
      setManagementError(
        err instanceof Error ? err.message : "Group management action failed",
      );
    } finally {
      setManaging(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
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
      <View className="gap-1">
        <Text className="text-sm text-muted">Group</Text>
        <Text className="text-2xl font-bold text-text">
          {detail.group.name}
        </Text>
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
        <Text className="text-sm text-danger">{managementError}</Text>
      ) : null}

      <View className="gap-2">
        <Text className="text-lg font-semibold text-text">Members</Text>
        <Card>
          {detail.members.map((m) => (
            <View
              key={m.id}
              className="flex-row justify-between border-b border-border py-2 last:border-0"
            >
              <View className="flex-1 gap-0.5">
                <Text className="text-text">{m.name}</Text>
                <Text className="text-sm text-muted">{m.email}</Text>
                <Text className="text-xs capitalize text-muted">
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
                <Text className="text-text">{b.otherUserName}</Text>
                <Text
                  className={
                    b.netAmount >= 0
                      ? "font-medium text-success"
                      : "font-medium text-danger"
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

      <View className="gap-2">
        <Text className="text-lg font-semibold text-text">Expenses</Text>
        {expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            subtitle="Add the first shared expense for this group."
          />
        ) : (
          expenses.map((e) => (
            <Card key={e.id}>
              <View
                className="flex-row items-center justify-between"
                onTouchEnd={() => router.push(`/(app)/expense/${e.id}`)}
              >
                <View>
                  <Text className="text-base text-text">{e.description}</Text>
                  <Text className="text-xs text-muted capitalize">
                    {e.splitType} split
                  </Text>
                </View>
                <Text className="text-base font-medium text-text">
                  {formatAmount(e.amount)}
                </Text>
              </View>
            </Card>
          ))
        )}
      </View>

      <ConfirmSheet
        visible={!!pendingAction}
        title={pendingAction?.type === "remove_member" ? "Remove member?" : "Cancel invitation?"}
        description={
          pendingAction?.type === "remove_member"
            ? "This removes the member from this group. Their existing expense history stays intact."
            : "The recipient will no longer be able to use this invitation link."
        }
        rows={
          pendingAction?.type === "remove_member"
            ? [{ label: "Member", value: pendingAction.member.name }]
            : pendingAction?.type === "cancel_invitation"
              ? [{ label: "Email", value: pendingAction.invitation.email }]
              : []
        }
        confirmLabel={pendingAction?.type === "remove_member" ? "Remove member" : "Cancel invitation"}
        destructive
        loading={managing}
        onConfirm={confirmManagementAction}
        onCancel={() => setPendingAction(null)}
      />
    </ScrollView>
  );
}
