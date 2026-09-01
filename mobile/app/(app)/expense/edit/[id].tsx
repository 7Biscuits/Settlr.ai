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

import { getExpense, updateExpense } from "../../../../src/api/expenses";
import { getGroup } from "../../../../src/api/groups";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type ExpenseWithSplits,
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

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);

  const [expense, setExpense] = useState<ExpenseWithSplits | null>(null);
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
      const { expense: exp } = await getExpense(id);
      const groupData = await getGroup(exp.groupId);
      setExpense(exp);
      setMembers(groupData.members);
      setDescription(exp.description);
      setAmountText((exp.amount / 100).toFixed(2));
      setCategory((exp.category as ExpenseCategory) ?? "general");
      setReceiptUrl(exp.receiptUrl ?? null);
      setPaidBy(exp.paidBy);
      setSplitType(exp.splitType);

      const sel: Record<string, boolean> = {};
      const customMap: Record<string, string> = {};
      const pctMap: Record<string, string> = {};
      const sharesMap: Record<string, string> = {};

      groupData.members.forEach((m) => {
        const split = exp.splits.find((s) => s.userId === m.id);
        if (split) {
          sel[m.id] = true;
          customMap[m.id] = (split.amountOwed / 100).toFixed(2);
          if (split.percentage) pctMap[m.id] = String(split.percentage);
          if (split.shares) sharesMap[m.id] = String(split.shares);
        } else {
          sharesMap[m.id] = "1";
        }
      });

      setSelected(sel);
      setCustomAmounts(customMap);
      setPercentages(pctMap);
      setShares(sharesMap);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load expense");
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
        return `Custom amounts (${formatAmount(sum)}) must sum to total (${formatAmount(amountMinor)}).`;
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
      await updateExpense(id, {
        description: description.trim(),
        amount: amountMinor,
        paidBy,
        category,
        receiptUrl: receiptUrl ?? null,
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
      setError(err instanceof ApiError ? err.message : "Failed to update expense");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading expense..." />;

  return (
    <View style={styles.safeArea}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.topSection, { paddingTop: topInset + 4 }]}>
          <View style={styles.headerRow}>
            <Pressable hitSlop={14} onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>EDIT EXPENSE</Text>
            <View style={styles.iconButton} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.bottomCard}>
          <View style={styles.inputCard}>
            <Text style={styles.cardHeader}>EXPENSE DETAILS</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Dinner"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Amount ($)</Text>
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

          {/* Category */}
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
          </View>

          {/* Receipt Picker */}
          <View style={styles.inputCard}>
            <ReceiptPicker receiptUrl={receiptUrl} onReceiptChange={setReceiptUrl} />
          </View>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <Pressable onPress={openConfirm} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Changes 👉</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Confirmation Sheet */}
      <ConfirmSheet
        visible={confirmOpen}
        title="Update Expense?"
        description="Settlr AI will recalculate friend balances."
        rows={[
          { label: "Description", value: description },
          { label: "Amount", value: amountMinor ? formatAmount(amountMinor) : "-" },
          { label: "Category", value: category.toUpperCase() },
        ]}
        confirmLabel="Save Changes"
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
  errorBanner: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#2738F5",
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
