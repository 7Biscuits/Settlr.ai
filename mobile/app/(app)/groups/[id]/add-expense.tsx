import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getGroup } from "../../../../src/api/groups";
import { createExpense } from "../../../../src/api/expenses";
import type { GroupMember } from "../../../../src/api/types";
import { Card } from "../../../../src/components/Card";
import { Button } from "../../../../src/components/Button";
import { Input } from "../../../../src/components/Input";
import { ConfirmSheet } from "../../../../src/components/ConfirmSheet";
import { LoadingState, ErrorState } from "../../../../src/components/States";
import {
  formatAmount,
  parseAmountToMinor,
  formatAbsAmount,
} from "../../../../src/lib/money";
import { splitEqualPreview } from "../../../../src/lib/split";
import { ApiError } from "../../../../src/api/client";

/**
 * Create a shared expense. Split math shown here is only a client-side preview
 * for UX; the backend computes and stores the authoritative splits.
 */
export default function AddExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const d = await getGroup(id);
      setMembers(d.members);
      // Default: everyone participates, first member pays.
      const sel: Record<string, boolean> = {};
      d.members.forEach((m) => (sel[m.id] = true));
      setSelected(sel);
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

  function validate(): string | null {
    if (!description.trim()) return "Enter a description.";
    if (!amountMinor) return "Enter a valid amount.";
    if (!paidBy) return "Select who paid.";
    if (participantIds.length === 0) return "Select at least one participant.";
    if (!participantIds.includes(paidBy))
      return "The payer must be one of the participants.";
    if (custom) {
      let sum = 0;
      for (const pid of participantIds) {
        const v = parseAmountToMinor(customAmounts[pid] ?? "");
        if (v === null) return "Enter a valid custom amount for each participant.";
        sum += v;
      }
      if (sum !== amountMinor)
        return `Custom amounts must add up to ${formatAmount(amountMinor)}.`;
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
        splitType: custom ? "custom" : "equal",
        participants: participantIds.map((pid) => ({
          userId: pid,
          amount: custom
            ? parseAmountToMinor(customAmounts[pid] ?? "") ?? 0
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
  if (loadError) return <ErrorState message={loadError} onRetry={load} />;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Text className="text-2xl font-bold text-text">Add expense</Text>

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

      <Card className="gap-2">
        <Text className="text-base font-medium text-text">Paid by</Text>
        {members.map((m) => (
          <Button
            key={m.id}
            title={m.name}
            variant={paidBy === m.id ? "primary" : "secondary"}
            onPress={() => setPaidBy(m.id)}
          />
        ))}
      </Card>

      <Card className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-medium text-text">
            Split by exact amounts
          </Text>
          <Switch value={custom} onValueChange={setCustom} />
        </View>

        {members.map((m) => {
          const isOn = !!selected[m.id];
          return (
            <View key={m.id} className="gap-1 border-b border-border py-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-text">{m.name}</Text>
                <Switch
                  value={isOn}
                  onValueChange={(v) =>
                    setSelected((s) => ({ ...s, [m.id]: v }))
                  }
                />
              </View>
              {isOn && custom ? (
                <Input
                  value={customAmounts[m.id] ?? ""}
                  onChangeText={(t) =>
                    setCustomAmounts((c) => ({ ...c, [m.id]: t }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              ) : isOn && equalPreview ? (
                <Text className="text-xs text-muted">
                  owes {formatAbsAmount(equalPreview.perPersonMax)}
                </Text>
              ) : null}
            </View>
          );
        })}
      </Card>

      {error ? <Text className="text-sm text-danger">{error}</Text> : null}

      <Button title="Review expense" onPress={openConfirm} />

      <ConfirmSheet
        visible={confirmOpen}
        title="Create expense?"
        description="This records a shared expense and updates balances on the backend."
        rows={[
          { label: "Description", value: description },
          { label: "Amount", value: amountMinor ? formatAmount(amountMinor) : "-" },
          {
            label: "Paid by",
            value: members.find((m) => m.id === paidBy)?.name ?? "-",
          },
          { label: "Split", value: custom ? "Custom" : "Equal" },
          { label: "Participants", value: String(participantIds.length) },
        ]}
        confirmLabel="Create expense"
        loading={submitting}
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
      />
    </ScrollView>
  );
}
