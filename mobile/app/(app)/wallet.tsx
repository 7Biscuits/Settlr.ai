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
import { ConfirmSheet } from "../../src/components/ConfirmSheet";
import { LoadingState } from "../../src/components/States";
import { UserLookupModal } from "../../src/components/UserLookupModal";
import { formatAmount, formatAbsAmount, parseAmountToMinor } from "../../src/lib/money";
import { ApiError } from "../../src/api/client";
import {
  BankBuildingIcon,
  MoneyBagIcon,
  SkullSparkleIcon,
} from "../../src/components/settlr/illustrations/TransactionIcons";

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
  const router = useRouter();
  const { user } = useAuth();
  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);

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
        {/* Top Section */}
        <View style={[styles.topSection, { paddingTop: topInset + 4 }]}>
          <View style={styles.headerRow}>
            <Pressable hitSlop={14} onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>SETTLR WALLET</Text>
            <View style={styles.iconButton} />
          </View>

          {/* Balance Display */}
          <View style={styles.balanceWrapper}>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <Text style={styles.balanceText}>{formatAmount(balance)}</Text>
            <View style={styles.vipBadge}>
              <Text style={styles.vipBadgeText}>⚡ Instant 0% Fee P2P Active</Text>
            </View>
          </View>

          {/* Action Pills */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => resetFlow("topup")}
              style={[styles.actionPill, flow === "topup" && styles.actionPillActive]}>
              <Feather name="plus" size={18} color={flow === "topup" ? "#0F172A" : "#FFFFFF"} />
              <Text style={[styles.actionPillText, flow === "topup" && styles.actionPillTextActive]}>
                Add Funds
              </Text>
            </Pressable>

            <Pressable
              onPress={() => resetFlow("transfer")}
              style={[styles.actionPill, flow === "transfer" && styles.actionPillActive]}>
              <Feather name="send" size={18} color={flow === "transfer" ? "#0F172A" : "#FFFFFF"} />
              <Text style={[styles.actionPillText, flow === "transfer" && styles.actionPillTextActive]}>
                Transfer
              </Text>
            </Pressable>

            <Pressable
              onPress={() => resetFlow("settlement")}
              style={[styles.actionPill, flow === "settlement" && styles.actionPillActive]}>
              <Feather name="check-circle" size={18} color={flow === "settlement" ? "#0F172A" : "#FFFFFF"} />
              <Text style={[styles.actionPillText, flow === "settlement" && styles.actionPillTextActive]}>
                Settle Debt
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom Card Content */}
        <View style={[styles.bottomCard, { paddingBottom: bottomInset }]}>
          {/* Active Flow Box */}
          {flow ? (
            <View style={styles.flowCard}>
              <Text style={styles.flowTitle}>
                {flow === "topup"
                  ? "Top Up Wallet Balance"
                  : flow === "transfer"
                  ? "Direct P2P Transfer"
                  : "Settle Group Debt"}
              </Text>

              {flow === "transfer" ? (
                <View style={styles.flowBody}>
                  <View style={styles.modeTabs}>
                    <Pressable
                      onPress={() => setTransferMode("search")}
                      style={[styles.modeTab, transferMode === "search" && styles.modeTabActive]}>
                      <Text style={[styles.modeTabText, transferMode === "search" && styles.modeTabTextActive]}>
                        Find Contact
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setTransferMode("group")}
                      style={[styles.modeTab, transferMode === "group" && styles.modeTabActive]}>
                      <Text style={[styles.modeTabText, transferMode === "group" && styles.modeTabTextActive]}>
                        Group Members
                      </Text>
                    </Pressable>
                  </View>

                  {transferMode === "search" ? (
                    directRecipient ? (
                      <View style={styles.recipientSelectedBox}>
                        <View>
                          <Text style={styles.recipientName}>{directRecipient.name}</Text>
                          {directRecipient.email ? (
                            <Text style={styles.recipientSub}>{directRecipient.email}</Text>
                          ) : null}
                        </View>
                        <Pressable onPress={() => setLookupModalOpen(true)}>
                          <Text style={styles.changeLink}>Change</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => setLookupModalOpen(true)}
                        style={styles.selectRecipientButton}>
                        <Ionicons name="search" size={18} color="#2738F5" />
                        <Text style={styles.selectRecipientText}>Search user or contact</Text>
                      </Pressable>
                    )
                  ) : (
                    <View style={styles.groupMembersList}>
                      {groups.map((g) => (
                        <Pressable
                          key={g.id}
                          onPress={() => void selectGroup(g)}
                          style={[styles.groupSelectPill, selectedGroup?.id === g.id && styles.groupSelectPillActive]}>
                          <Text style={[styles.groupSelectText, selectedGroup?.id === g.id && styles.groupSelectTextActive]}>
                            {g.name}
                          </Text>
                        </Pressable>
                      ))}

                      {selectedGroup && members.length > 0 ? (
                        <View style={styles.membersRow}>
                          {members.map((m) => (
                            <Pressable
                              key={m.id}
                              onPress={() => setGroupRecipient(m)}
                              style={[styles.memberPill, groupRecipient?.id === m.id && styles.memberPillActive]}>
                              <Text style={[styles.memberPillText, groupRecipient?.id === m.id && styles.memberPillTextActive]}>
                                {m.name}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              ) : null}

              {flow === "settlement" ? (
                <View style={styles.flowBody}>
                  <Text style={styles.sublabel}>Select Group to Settle:</Text>
                  <View style={styles.groupPillsGrid}>
                    {groups.map((g) => (
                      <Pressable
                        key={g.id}
                        onPress={() => void selectGroup(g)}
                        style={[styles.groupSelectPill, selectedGroup?.id === g.id && styles.groupSelectPillActive]}>
                        <Text style={[styles.groupSelectText, selectedGroup?.id === g.id && styles.groupSelectTextActive]}>
                          {g.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {selectedGroup && debts.length > 0 ? (
                    <View style={styles.debtsSelectGroup}>
                      <Text style={styles.sublabel}>Select Debt to Settle:</Text>
                      {debts.map((d) => (
                        <Pressable
                          key={d.otherUserId}
                          onPress={() => {
                            setDebt(d);
                            setAmountText(minorToInput(Math.abs(d.netAmount)));
                          }}
                          style={[styles.debtSelectPill, debt?.otherUserId === d.otherUserId && styles.debtSelectPillActive]}>
                          <Text style={styles.debtSelectName}>{d.otherUserName}</Text>
                          <Text style={styles.debtSelectAmount}>{formatAbsAmount(d.netAmount)}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Amount Input */}
              <View style={styles.amountInputRow}>
                <Text style={styles.amountPrefix}>$</Text>
                <TextInput
                  value={amountText}
                  onChangeText={setAmountText}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  style={styles.amountInput}
                />
              </View>

              {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

              <Pressable
                onPress={openConfirmation}
                disabled={!amount}
                style={[styles.submitButton, !amount && styles.submitButtonDisabled]}>
                <Text style={styles.submitButtonText}>Review & Confirm 👉</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Activity Section */}
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>TRANSACTION HISTORY</Text>
          </View>

          <View style={styles.transactionList}>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>No wallet transactions yet.</Text>
            ) : (
              transactions.map((t) => (
                <View key={t.id} style={styles.transactionRow}>
                  <View style={styles.txLeft}>
                    {t.type === "topup" ? (
                      <BankBuildingIcon />
                    ) : t.type === "transfer" ? (
                      <MoneyBagIcon />
                    ) : (
                      <SkullSparkleIcon />
                    )}
                    <View>
                      <Text style={styles.txTitle}>{t.type.toUpperCase()}</Text>
                      <Text style={styles.txStatus}>{t.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, t.amount > 0 ? styles.posAmount : styles.negAmount]}>
                    {formatAmount(t.amount)}
                  </Text>
                </View>
              ))
            )}
          </View>

          {hasMoreTransactions && transactions.length > 0 ? (
            <Pressable
              onPress={loadMoreTransactions}
              disabled={loadingMore}
              style={styles.loadMoreButton}>
              <Text style={styles.loadMoreText}>
                {loadingMore ? "Loading..." : "Load More Activity"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

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
        description="Settlr AI will execute this transaction instantly with 0 fees."
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

      {/* User Discovery Modal */}
      <UserLookupModal
        visible={lookupModalOpen}
        title="Transfer Recipient"
        onSelect={(u) => {
          setDirectRecipient(u);
          setLookupModalOpen(false);
        }}
        onCancel={() => setLookupModalOpen(false)}
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
  balanceWrapper: {
    alignItems: "center",
    marginVertical: 10,
  },
  balanceLabel: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  balanceText: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  vipBadge: {
    backgroundColor: "#00F58D",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  vipBadgeText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  actionPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionPillActive: {
    backgroundColor: "#00F58D",
  },
  actionPillText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
  actionPillTextActive: {
    color: "#0F172A",
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
  flowCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  flowBody: {
    gap: 10,
    marginBottom: 12,
  },
  modeTabs: {
    flexDirection: "row",
    gap: 8,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
  },
  modeTabActive: {
    backgroundColor: "#2738F5",
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  modeTabTextActive: {
    color: "#FFFFFF",
  },
  recipientSelectedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  recipientSub: {
    fontSize: 12,
    color: "#64748B",
  },
  changeLink: {
    color: "#2738F5",
    fontSize: 13,
    fontWeight: "700",
  },
  selectRecipientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  selectRecipientText: {
    color: "#2738F5",
    fontSize: 14,
    fontWeight: "700",
  },
  groupMembersList: {
    gap: 8,
  },
  groupSelectPill: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  groupSelectPillActive: {
    backgroundColor: "#2738F5",
  },
  groupSelectText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  groupSelectTextActive: {
    color: "#FFFFFF",
  },
  membersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  memberPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  memberPillActive: {
    backgroundColor: "#00F58D",
  },
  memberPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  memberPillTextActive: {
    color: "#0F172A",
  },
  sublabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  groupPillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  debtsSelectGroup: {
    gap: 6,
    marginTop: 8,
  },
  debtSelectPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 10,
  },
  debtSelectPillActive: {
    backgroundColor: "#DBEAFE",
    borderWidth: 1.5,
    borderColor: "#2738F5",
  },
  debtSelectName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  debtSelectAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#DC2626",
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginVertical: 8,
  },
  amountPrefix: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  submitButton: {
    backgroundColor: "#2738F5",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  transactionsHeader: {
    marginTop: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  transactionList: {
    gap: 12,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 20,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  txStatus: {
    fontSize: 12,
    color: "#64748B",
    textTransform: "capitalize",
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  posAmount: {
    color: "#059669",
  },
  negAmount: {
    color: "#0F172A",
  },
  loadMoreButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2738F5",
  },
});
