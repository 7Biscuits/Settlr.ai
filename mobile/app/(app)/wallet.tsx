import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getWalletBalance,
  listTransactions,
  newIdempotencyKey,
  settle,
  topUp,
  transfer,
} from "../../src/api/wallet";
import { getGroup, listGroups } from "../../src/api/groups";
import { getGroupBalances } from "../../src/api/balances";
import type {
  ContactMatchUser,
  DirectedBalance,
  Group,
  GroupMember,
  Transaction,
} from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthContext";
import { Card } from "../../src/components/Card";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { ConfirmSheet } from "../../src/components/ConfirmSheet";
import { StatusBadge } from "../../src/components/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/States";
import { UserLookupModal } from "../../src/components/UserLookupModal";
import { formatAmount, formatAbsAmount, parseAmountToMinor } from "../../src/lib/money";
import { ApiError } from "../../src/api/client";

type Flow = "topup" | "transfer" | "settlement" | null;

type PendingPayment =
  | { type: "topup"; amount: number; idempotencyKey: string }
  | {
      type: "transfer";
      amount: number;
      idempotencyKey: string;
      toUserId: string;
      recipientName: string;
    }
  | {
      type: "settlement";
      amount: number;
      idempotencyKey: string;
      groupId: string;
      groupName: string;
      toUserId: string;
      recipientName: string;
    };

function minorToInput(amount: number): string {
  return (amount / 100).toFixed(2);
}

const PAGE_SIZE = 20;

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [flow, setFlow] = useState<Flow>(null);
  const [flowLoading, setFlowLoading] = useState(false);

  // Transfer Recipient Selection Mode
  const [transferMode, setTransferMode] = useState<"search" | "group">("search");
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [directRecipient, setDirectRecipient] = useState<ContactMatchUser | null>(null);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [debts, setDebts] = useState<DirectedBalance[]>([]);
  const [groupRecipient, setGroupRecipient] = useState<GroupMember | null>(null);
  const [debt, setDebt] = useState<DirectedBalance | null>(null);
  const [amountText, setAmountText] = useState("");
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [wallet, activity, groupResult] = await Promise.all([
        getWalletBalance(),
        listTransactions(PAGE_SIZE, 0),
        listGroups(),
      ]);
      setBalance(wallet.balance);
      setTransactions(activity.transactions);
      setOffset(0);
      setHasMoreTransactions(activity.transactions.length === PAGE_SIZE);
      setGroups(groupResult.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function loadMoreTransactions() {
    if (loadingMore || !hasMoreTransactions) return;
    setLoadingMore(true);
    try {
      const nextOffset = offset + PAGE_SIZE;
      const res = await listTransactions(PAGE_SIZE, nextOffset);
      if (res.transactions.length < PAGE_SIZE) {
        setHasMoreTransactions(false);
      }
      setTransactions((prev) => [...prev, ...res.transactions]);
      setOffset(nextOffset);
    } catch {
      // Ignore load more failure
    } finally {
      setLoadingMore(false);
    }
  }

  const amount = parseAmountToMinor(amountText);

  function resetFlow(next: Flow) {
    setFlow(next);
    setActionError(null);
    setSelectedGroup(null);
    setMembers([]);
    setDebts([]);
    setGroupRecipient(null);
    setDirectRecipient(null);
    setDebt(null);
    setAmountText("");
  }

  async function selectGroup(group: Group) {
    setActionError(null);
    setSelectedGroup(group);
    setGroupRecipient(null);
    setDebt(null);
    setAmountText("");
    setFlowLoading(true);
    try {
      if (flow === "transfer") {
        const detail = await getGroup(group.id);
        setMembers(detail.members.filter((member) => member.id !== user?.id));
      } else if (flow === "settlement") {
        const result = await getGroupBalances(group.id);
        setDebts(result.balances.filter((item) => item.netAmount < 0));
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load group details");
    } finally {
      setFlowLoading(false);
    }
  }

  function openConfirmation() {
    setActionError(null);
    if (!amount) {
      setActionError("Enter a valid amount.");
      return;
    }
    if (flow === "topup") {
      setPendingPayment({ type: "topup", amount, idempotencyKey: newIdempotencyKey("topup") });
      return;
    }
    if (flow === "transfer") {
      const chosenRecipient = transferMode === "search" ? directRecipient : groupRecipient;
      if (!chosenRecipient) {
        setActionError("Choose a recipient to transfer funds to.");
        return;
      }
      setPendingPayment({
        type: "transfer",
        amount,
        idempotencyKey: newIdempotencyKey("transfer"),
        toUserId: chosenRecipient.id,
        recipientName: chosenRecipient.name,
      });
      return;
    }
    if (flow === "settlement") {
      if (!selectedGroup || !debt) {
        setActionError("Choose a group balance to settle.");
        return;
      }
      setPendingPayment({
        type: "settlement",
        amount,
        idempotencyKey: newIdempotencyKey("settlement"),
        groupId: selectedGroup.id,
        groupName: selectedGroup.name,
        toUserId: debt.otherUserId,
        recipientName: debt.otherUserName,
      });
    }
  }

  async function submitPayment() {
    if (!pendingPayment) return;
    setSubmitting(true);
    setActionError(null);
    try {
      if (pendingPayment.type === "topup") {
        const result = await topUp(pendingPayment.amount, pendingPayment.idempotencyKey);
        setBalance(result.balance);
      } else if (pendingPayment.type === "transfer") {
        await transfer(
          pendingPayment.toUserId,
          pendingPayment.amount,
          pendingPayment.idempotencyKey,
        );
      } else {
        await settle(
          pendingPayment.groupId,
          pendingPayment.toUserId,
          pendingPayment.amount,
          pendingPayment.idempotencyKey,
        );
      }
      setPendingPayment(null);
      resetFlow(null);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Payment action failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading wallet..." />;

  const confirmationRows = pendingPayment
    ? [
        { label: "Amount", value: formatAmount(pendingPayment.amount) },
        ...(pendingPayment.type === "transfer"
          ? [{ label: "Recipient", value: pendingPayment.recipientName }]
          : pendingPayment.type === "settlement"
            ? [
                { label: "To", value: pendingPayment.recipientName },
                { label: "Group", value: pendingPayment.groupName },
              ]
            : []),
      ]
    : [];

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
      <Text className="text-2xl font-bold text-text">Wallet</Text>

      <Card>
        <Text className="text-sm text-muted">Available balance</Text>
        <Text className="mt-1 text-3xl font-bold text-text">{formatAmount(balance)}</Text>
      </Card>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button title="Add funds" variant={flow === "topup" ? "primary" : "secondary"} onPress={() => resetFlow("topup")} />
        </View>
        <View className="flex-1">
          <Button title="Transfer" variant={flow === "transfer" ? "primary" : "secondary"} onPress={() => resetFlow("transfer")} />
        </View>
        <View className="flex-1">
          <Button title="Settle" variant={flow === "settlement" ? "primary" : "secondary"} onPress={() => resetFlow("settlement")} />
        </View>
      </View>

      {flow ? (
        <Card className="gap-3">
          <Text className="text-base font-semibold text-text">
            {flow === "topup" ? "Add demo funds" : flow === "transfer" ? "Transfer funds" : "Settle a group debt"}
          </Text>

          {/* Transfer Flow */}
          {flow === "transfer" ? (
            <View className="gap-3">
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button
                    title="Find Any User"
                    variant={transferMode === "search" ? "primary" : "secondary"}
                    onPress={() => setTransferMode("search")}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title="Group Members"
                    variant={transferMode === "group" ? "primary" : "secondary"}
                    onPress={() => setTransferMode("group")}
                  />
                </View>
              </View>

              {transferMode === "search" ? (
                <View className="gap-2">
                  <Text className="text-sm text-muted">Recipient</Text>
                  {directRecipient ? (
                    <Card className="flex-row items-center justify-between bg-surface2">
                      <View className="gap-0.5">
                        <Text className="text-base font-semibold text-text">
                          {directRecipient.name}
                        </Text>
                        {directRecipient.email ? (
                          <Text className="text-xs text-muted">
                            {directRecipient.email}
                          </Text>
                        ) : null}
                      </View>
                      <Button
                        title="Change"
                        variant="secondary"
                        onPress={() => setLookupModalOpen(true)}
                      />
                    </Card>
                  ) : (
                    <Button
                      title="🔍 Find User or Contact"
                      variant="secondary"
                      onPress={() => setLookupModalOpen(true)}
                    />
                  )}
                </View>
              ) : (
                <View className="gap-2">
                  <Text className="text-sm text-muted">Choose a group</Text>
                  {groups.length === 0 ? (
                    <Text className="text-sm text-muted">No groups available.</Text>
                  ) : (
                    groups.map((group) => (
                      <Button
                        key={group.id}
                        title={group.name}
                        variant={selectedGroup?.id === group.id ? "primary" : "secondary"}
                        loading={flowLoading && selectedGroup?.id === group.id}
                        onPress={() => void selectGroup(group)}
                      />
                    ))
                  )}

                  {selectedGroup && !flowLoading ? (
                    <View className="gap-2 pt-2">
                      <Text className="text-sm text-muted">Choose group member</Text>
                      {members.length === 0 ? (
                        <Text className="text-sm text-muted">This group has no other members to transfer to.</Text>
                      ) : (
                        members.map((member) => (
                          <Button
                            key={member.id}
                            title={member.name}
                            variant={groupRecipient?.id === member.id ? "primary" : "secondary"}
                            onPress={() => setGroupRecipient(member)}
                          />
                        ))
                      )}
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          ) : null}

          {/* Settlement Flow */}
          {flow === "settlement" ? (
            <View className="gap-2">
              <Text className="text-sm text-muted">Choose a group</Text>
              {groups.length === 0 ? (
                <Text className="text-sm text-muted">Create a group before settling funds.</Text>
              ) : (
                groups.map((group) => (
                  <Button
                    key={group.id}
                    title={group.name}
                    variant={selectedGroup?.id === group.id ? "primary" : "secondary"}
                    loading={flowLoading && selectedGroup?.id === group.id}
                    onPress={() => void selectGroup(group)}
                  />
                ))
              )}

              {selectedGroup && !flowLoading ? (
                <View className="gap-2 pt-2">
                  <Text className="text-sm text-muted">Choose an outstanding debt</Text>
                  {debts.length === 0 ? (
                    <Text className="text-sm text-muted">You have no outstanding debt in this group.</Text>
                  ) : (
                    debts.map((item) => (
                      <Button
                        key={item.otherUserId}
                        title={`${item.otherUserName} · ${formatAbsAmount(item.netAmount)}`}
                        variant={debt?.otherUserId === item.otherUserId ? "primary" : "secondary"}
                        onPress={() => {
                          setDebt(item);
                          setAmountText(minorToInput(Math.abs(item.netAmount)));
                        }}
                      />
                    ))
                  )}
                </View>
              ) : null}
            </View>
          ) : null}

          <Input
            label="Amount"
            value={amountText}
            onChangeText={setAmountText}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          {actionError ? <Text className="text-sm text-danger">{actionError}</Text> : null}
          <Button title="Review action" disabled={!amount} onPress={openConfirmation} />
        </Card>
      ) : null}

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {/* Paginated Transactions List */}
      <View className="gap-2">
        <Text className="text-lg font-semibold text-text">Transactions</Text>
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" subtitle="Top up, transfer, or settle a debt to see activity here." />
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction.id}>
              <View className="flex-row items-center justify-between">
                <View className="gap-1">
                  <Text className="text-base capitalize text-text">{transaction.type}</Text>
                  <StatusBadge status={transaction.status} />
                </View>
                <Text className="text-base font-medium text-text">{formatAmount(transaction.amount)}</Text>
              </View>
            </Card>
          ))
        )}

        {hasMoreTransactions && transactions.length > 0 ? (
          <Button
            title="Load more transactions"
            variant="secondary"
            loading={loadingMore}
            onPress={loadMoreTransactions}
          />
        ) : null}
      </View>

      {/* Confirmation Dialog */}
      <ConfirmSheet
        visible={!!pendingPayment}
        title={
          pendingPayment?.type === "settlement"
            ? "Confirm Settlement"
            : pendingPayment?.type === "transfer"
              ? "Confirm Transfer"
              : "Confirm Top-up"
        }
        description="PayPilot will execute this transfer securely on the backend."
        rows={confirmationRows}
        confirmLabel={
          pendingPayment?.type === "settlement"
            ? "Settle Debt"
            : pendingPayment?.type === "transfer"
              ? "Send Funds"
              : "Add Funds"
        }
        loading={submitting}
        onConfirm={submitPayment}
        onCancel={() => setPendingPayment(null)}
      />

      {/* User Discovery Modal for Transfers */}
      <UserLookupModal
        visible={lookupModalOpen}
        title="Transfer Recipient"
        onSelect={(u) => {
          setDirectRecipient(u);
          setLookupModalOpen(false);
        }}
        onCancel={() => setLookupModalOpen(false)}
      />
    </ScrollView>
  );
}
