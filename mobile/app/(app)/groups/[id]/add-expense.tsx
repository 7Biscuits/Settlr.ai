import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

import { getGroup } from "../../../../src/api/groups";
import { createExpense } from "../../../../src/api/expenses";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type GroupMember,
  type SplitType,
} from "../../../../src/api/types";
import { ReceiptPicker } from "../../../../src/components/ReceiptPicker";
import { ConfirmSheet } from "../../../../src/components/ConfirmSheet";
import { LoadingState } from "../../../../src/components/States";
import {
  formatAmount,
  parseAmountToMinor,
  formatAbsAmount,
} from "../../../../src/lib/money";
import {
  splitEqualPreview,
  splitPercentagePreview,
  splitSharesPreview,
} from "../../../../src/lib/split";
import { ApiError } from "../../../../src/api/client";

export default function AddExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("general");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});

  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const d = await getGroup(id);
      setMembers(d.members);
      const sel: Record<string, boolean> = {};
      const initShares: Record<string, string> = {};
      d.members.forEach((m) => {
        sel[m.id] = true;
        initShares[m.id] = "1";
      });
      setSelected(sel);
      setShares(initShares);
      setPaidBy(d.members[0]?.id ?? null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const amountMinor = parseAmountToMinor(amountText);
  const participantIds = useMemo(
    () => members.filter((m) => selected[m.id]).map((m) => m.id),
    [members, selected],
  );

  const equalPreview = useMemo(() => {
    if (!amountMinor || participantIds.length === 0) return null;
    return splitEqualPreview(amountMinor, participantIds.length);
  }, [amountMinor, participantIds.length]);

  const percentagePreview = useMemo(() => {
    if (!amountMinor || participantIds.length === 0 || splitType !== "percentage") return null;
    const pList = participantIds.map((pid) => parseFloat(percentages[pid] || "0") || 0);
    return splitPercentagePreview(amountMinor, pList);
  }, [amountMinor, participantIds, percentages, splitType]);

  const sharesPreview = useMemo(() => {
    if (!amountMinor || participantIds.length === 0 || splitType !== "shares") return null;
    const sList = participantIds.map((pid) => parseInt(shares[pid] || "1", 10) || 1);
    return splitSharesPreview(amountMinor, sList);
  }, [amountMinor, participantIds, shares, splitType]);

  function validate(): string | null {
    if (!description.trim()) return "Enter a description.";
    if (!amountMinor) return "Enter a valid amount.";
    if (!paidBy) return "Select who paid.";
    if (participantIds.length === 0) return "Select at least one participant.";
    if (!participantIds.includes(paidBy))
      return "The payer must be one of the participants.";

    if (splitType === "custom") {
      let sum = 0;
      for (const pid of participantIds) {
        const v = parseAmountToMinor(customAmounts[pid] ?? "");
        if (v === null) return "Enter a valid custom amount for each participant.";
        sum += v;
      }
      if (sum !== amountMinor)
        return `Custom amounts (${formatAmount(sum)}) must sum to total amount (${formatAmount(amountMinor)}).`;
    }

    if (splitType === "percentage") {
      let sum = 0;
      for (const pid of participantIds) {
        const p = parseFloat(percentages[pid] ?? "");
        if (isNaN(p) || p < 0) return "Enter a valid positive percentage for each participant.";
        sum += p;
      }
      if (Math.abs(sum - 100) > 0.01) {
        return `Percentages sum to ${sum}%. They must sum exactly to 100%.`;
      }
    }

    if (splitType === "shares") {
      for (const pid of participantIds) {
        const s = parseInt(shares[pid] ?? "", 10);
        if (isNaN(s) || s <= 0) return "Each participant must have at least 1 share.";
      }
    }

    return null;
  }

  function openConfirm() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setConfirmOpen(true);
  }

  async function submit() {
    if (!id || !amountMinor || !paidBy) return;
    setSubmitting(true);
    try {
      await createExpense(id, {
        description: description.trim(),
        amount: amountMinor,
        paidBy,
        category,
        receiptUrl: receiptUrl ?? undefined,
        splitType,
        participants: participantIds.map((pid) => ({
          userId: pid,
          amount: splitType === "custom"
            ? parseAmountToMinor(customAmounts[pid] ?? "") ?? 0
            : undefined,
          percentage: splitType === "percentage"
            ? parseFloat(percentages[pid] ?? "0")
            : undefined,
          shares: splitType === "shares"
            ? parseInt(shares[pid] ?? "1", 10)
            : undefined,
        })),
      });
      setConfirmOpen(false);
      router.back();
    } catch (err) {
      setConfirmOpen(false);
      setError(err instanceof ApiError ? err.message : "Failed to create expense");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading group..." />;

  const bottomInset = Math.max(insets.bottom + 24, Platform.OS === "android" ? 56 : 36);

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
            <Text style={styles.headerTitle}>ADD SPLIT EXPENSE</Text>
            <View style={styles.iconButton} />
          </View>
        </View>

        {/* Content Body */}
        <View style={[styles.bottomCard, { paddingBottom: bottomInset }]}>
          {/* Main Inputs Card */}
          <View style={styles.inputCard}>
            <Text style={styles.cardHeader}>EXPENSE DETAILS</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Dinner, Drinks, Fuel"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Amount (₹)</Text>
              <TextInput
                value={amountText}
                onChangeText={setAmountText}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>
          </View>

          {/* Category Picker */}
          <View style={styles.inputCard}>
            <Text style={styles.cardHeader}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsRow}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.catPill, category === cat && styles.catPillActive]}>
                  <Text style={[styles.catPillText, category === cat && styles.catPillTextActive]}>
                    {cat.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Paid By */}
          <View style={styles.inputCard}>
            <Text style={styles.cardHeader}>PAID BY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsRow}>
              {members.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setPaidBy(m.id)}
                  style={[styles.catPill, paidBy === m.id && styles.catPillActive]}>
                  <Text style={[styles.catPillText, paidBy === m.id && styles.catPillTextActive]}>
                    {m.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Split Type Selector */}
          <View style={styles.inputCard}>
            <Text style={styles.cardHeader}>SPLIT METHOD</Text>
            <View style={styles.splitTabsRow}>
              {(["equal", "custom", "percentage", "shares"] as SplitType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setSplitType(t)}
                  style={[styles.splitTab, splitType === t && styles.splitTabActive]}>
                  <Text style={[styles.splitTabText, splitType === t && styles.splitTabTextActive]}>
                    {t.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Member Toggles */}
            <View style={styles.membersToggleList}>
              {members.map((m) => {
                const isOn = !!selected[m.id];
                return (
                  <View key={m.id} style={styles.memberToggleRow}>
                    <View style={styles.memberLeft}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      {isOn && splitType === "equal" && equalPreview ? (
                        <Text style={styles.memberOweSub}>
                          owes {formatAbsAmount(equalPreview.perPersonMax)}
                        </Text>
                      ) : null}
                    </View>

                    <Pressable
                      onPress={() => setSelected((s) => ({ ...s, [m.id]: !isOn }))}
                      style={[styles.includePill, isOn && styles.includePillActive]}>
                      <Text style={[styles.includePillText, isOn && styles.includePillTextActive]}>
                        {isOn ? "✓ Included" : "Excluded"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Receipt Picker */}
          <View style={styles.inputCard}>
            <ReceiptPicker receiptUrl={receiptUrl} onReceiptChange={setReceiptUrl} />
          </View>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <Pressable
            onPress={openConfirm}
            style={styles.reviewButton}>
            <Text style={styles.reviewButtonText}>Review Split Expense 👉</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Confirmation Sheet */}
      <ConfirmSheet
        visible={confirmOpen}
        title="Create Expense?"
        description="Settlr AI will record this bill and update all friend balances."
        rows={[
          { label: "Description", value: description },
          { label: "Amount", value: amountMinor ? formatAmount(amountMinor) : "-" },
          { label: "Category", value: category.toUpperCase() },
          {
            label: "Paid by",
            value: members.find((m) => m.id === paidBy)?.name ?? "-",
          },
          { label: "Split Type", value: splitType.toUpperCase() },
          { label: "Participants", value: String(participantIds.length) },
        ]}
        confirmLabel="Record Expense"
        loading={submitting}
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
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
    gap: 16,
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
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 12.5,
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
  categoryPillsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  catPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  catPillActive: {
    backgroundColor: "#2738F5",
  },
  catPillText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#2738F5",
  },
  catPillTextActive: {
    color: "#FFFFFF",
  },
  splitTabsRow: {
    flexDirection: "row",
    gap: 6,
  },
  splitTab: {
    flex: 1,
    backgroundColor: "#E2E8F0",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  splitTabActive: {
    backgroundColor: "#2738F5",
  },
  splitTabText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  splitTabTextActive: {
    color: "#FFFFFF",
  },
  membersToggleList: {
    gap: 10,
    marginTop: 6,
  },
  memberToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  memberLeft: {
    gap: 2,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  memberOweSub: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  includePill: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  includePillActive: {
    backgroundColor: "#00F58D",
  },
  includePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  includePillTextActive: {
    color: "#0F172A",
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
  reviewButton: {
    backgroundColor: "#2738F5",
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  reviewButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
