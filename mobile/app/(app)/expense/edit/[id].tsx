import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getExpense, updateExpense } from "../../../../src/api/expenses";
import { getGroup } from "../../../../src/api/groups";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type ExpenseWithSplits,
  type GroupMember,
  type SplitType,
} from "../../../../src/api/types";
import { Card } from "../../../../src/components/Card";
import { Button } from "../../../../src/components/Button";
import { Input } from "../../../../src/components/Input";
import { ReceiptPicker } from "../../../../src/components/ReceiptPicker";
import { ConfirmSheet } from "../../../../src/components/ConfirmSheet";
import { LoadingState, ErrorState } from "../../../../src/components/States";
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
  if (loadError) return <ErrorState message={loadError} onRetry={load} />;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
    >
      <View className="flex-row items-center gap-2">
        <Button title="←" variant="ghost" onPress={() => router.back()} />
        <Text className="text-2xl font-bold text-text">Edit Expense</Text>
      </View>

      <Card className="gap-3">
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Dinner"
        />
        <Input
          label="Amount"
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
      </Card>

      {/* Category Picker */}
      <Card className="gap-2">
        <Text className="text-base font-medium text-text">Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {EXPENSE_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              title={cat.charAt(0).toUpperCase() + cat.slice(1)}
              variant={category === cat ? "primary" : "secondary"}
              onPress={() => setCategory(cat)}
            />
          ))}
        </ScrollView>
      </Card>

      {/* Payer Picker */}
      <Card className="gap-2">
        <Text className="text-base font-medium text-text">Paid by</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {members.map((m) => (
            <Button
              key={m.id}
              title={m.name}
              variant={paidBy === m.id ? "primary" : "secondary"}
              onPress={() => setPaidBy(m.id)}
            />
          ))}
        </ScrollView>
      </Card>

      {/* Split Type Selector */}
      <Card className="gap-3">
        <Text className="text-base font-medium text-text">Split Method</Text>
        <View className="flex-row gap-2">
          {(["equal", "custom", "percentage", "shares"] as SplitType[]).map((t) => (
            <View key={t} className="flex-1">
              <Button
                title={t.charAt(0).toUpperCase() + t.slice(1)}
                variant={splitType === t ? "primary" : "secondary"}
                onPress={() => setSplitType(t)}
              />
            </View>
          ))}
        </View>

        <View className="gap-2 pt-2">
          {members.map((m, index) => {
            const isOn = !!selected[m.id];
            return (
              <View key={m.id} className="gap-1 border-b border-border py-2.5 last:border-0">
                <View className="flex-row items-center justify-between">
                  <Text className="text-text font-medium">{m.name}</Text>
                  <Button
                    title={isOn ? "Included ✓" : "Excluded"}
                    variant={isOn ? "secondary" : "ghost"}
                    onPress={() => setSelected((s) => ({ ...s, [m.id]: !isOn }))}
                  />
                </View>

                {isOn ? (
                  <View className="mt-1">
                    {splitType === "equal" && equalPreview ? (
                      <Text className="text-xs text-muted">
                        owes {formatAbsAmount(equalPreview.perPersonMax)}
                      </Text>
                    ) : null}

                    {splitType === "custom" ? (
                      <Input
                        label="Exact Amount"
                        value={customAmounts[m.id] ?? ""}
                        onChangeText={(t) =>
                          setCustomAmounts((c) => ({ ...c, [m.id]: t }))
                        }
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                      />
                    ) : null}

                    {splitType === "percentage" ? (
                      <View className="gap-1">
                        <Input
                          label="Percentage (%)"
                          value={percentages[m.id] ?? ""}
                          onChangeText={(t) =>
                            setPercentages((p) => ({ ...p, [m.id]: t }))
                          }
                          keyboardType="decimal-pad"
                          placeholder="50"
                        />
                        {percentagePreview && percentagePreview[index] !== undefined ? (
                          <Text className="text-xs text-muted">
                            = {formatAmount(percentagePreview[index] ?? 0)}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}

                    {splitType === "shares" ? (
                      <View className="gap-1">
                        <Input
                          label="Shares / Weight"
                          value={shares[m.id] ?? "1"}
                          onChangeText={(t) =>
                            setShares((s) => ({ ...s, [m.id]: t }))
                          }
                          keyboardType="number-pad"
                          placeholder="1"
                        />
                        {sharesPreview && sharesPreview[index] !== undefined ? (
                          <Text className="text-xs text-muted">
                            = {formatAmount(sharesPreview[index] ?? 0)}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </Card>

      {/* Receipt Attachment */}
      <Card>
        <ReceiptPicker
          receiptUrl={receiptUrl}
          onReceiptChange={setReceiptUrl}
        />
      </Card>

      {error ? <Text className="text-sm text-danger">{error}</Text> : null}

      <Button title="Save Changes" onPress={openConfirm} />

      <ConfirmSheet
        visible={confirmOpen}
        title="Update Expense?"
        description="PayPilot will recalculate member balances on the backend."
        rows={[
          { label: "Description", value: description },
          { label: "Amount", value: amountMinor ? formatAmount(amountMinor) : "-" },
          { label: "Category", value: category.toUpperCase() },
          {
            label: "Paid by",
            value: members.find((m) => m.id === paidBy)?.name ?? "-",
          },
          { label: "Split Type", value: splitType.toUpperCase() },
        ]}
        confirmLabel="Save Changes"
        loading={submitting}
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
      />
    </ScrollView>
  );
}
