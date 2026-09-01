import React, { useCallback, useState } from "react";
import { Image, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getExpense, deleteExpense } from "../../../src/api/expenses";
import type { ExpenseWithSplits } from "../../../src/api/types";
import { Card } from "../../../src/components/Card";
import { Button } from "../../../src/components/Button";
import { ConfirmSheet } from "../../../src/components/ConfirmSheet";
import { LoadingState, ErrorState } from "../../../src/components/States";
import { formatAmount } from "../../../src/lib/money";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [expense, setExpense] = useState<ExpenseWithSplits | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const { expense: exp } = await getExpense(id);
      setExpense(exp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expense");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteExpense(id);
      setDeleteOpen(false);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <LoadingState label="Loading expense..." />;
  if (error && !expense) return <ErrorState message={error} onRetry={load} />;
  if (!expense) return <ErrorState message="Expense not found" />;

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
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Button title="←" variant="ghost" onPress={() => router.back()} />
          <Text className="text-2xl font-bold text-text">Expense Details</Text>
        </View>
        <View className="flex-row gap-2">
          <Button
            title="Edit"
            variant="secondary"
            onPress={() => router.push(`/(app)/expense/edit/${expense.id}`)}
          />
          <Button
            title="Delete"
            variant="danger"
            onPress={() => setDeleteOpen(true)}
          />
        </View>
      </View>

      {error ? <ErrorState message={error} /> : null}

      {/* Main Expense Card */}
      <Card className="gap-2 bg-surface2">
        <View className="flex-row items-center justify-between">
          <View className="rounded bg-primary/20 px-2 py-1">
            <Text className="text-xs font-bold uppercase text-primary">
              {expense.category ?? "general"}
            </Text>
          </View>
          <Text className="text-xs text-muted">
            {new Date(expense.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <Text className="text-2xl font-bold text-text">
          {expense.description}
        </Text>

        <Text className="text-3xl font-extrabold text-text">
          {formatAmount(expense.amount)}
        </Text>

        <View className="flex-row items-center gap-2 pt-1 border-t border-border">
          <Text className="text-xs text-muted">Split Type:</Text>
          <Text className="text-xs font-semibold uppercase text-text">
            {expense.splitType}
          </Text>
        </View>
      </Card>

      {/* Receipt Image Card */}
      {expense.receiptUrl ? (
        <Card className="gap-2">
          <Text className="text-base font-semibold text-text">Attached Receipt</Text>
          <Pressable
            onPress={() => setReceiptModalOpen(true)}
            className="items-center overflow-hidden rounded-xl border border-border bg-surface2 active:opacity-80"
          >
            <Image
              source={{ uri: expense.receiptUrl }}
              className="h-48 w-full"
              resizeMode="cover"
            />
            <View className="w-full bg-surface p-2 text-center">
              <Text className="text-xs text-primary font-medium text-center">
                Tap to view full-size receipt
              </Text>
            </View>
          </Pressable>
        </Card>
      ) : null}

      {/* Split Breakdown */}
      <View className="gap-2">
        <Text className="text-lg font-semibold text-text">Split Breakdown</Text>
        <Card>
          {expense.splits.map((s) => (
            <View
              key={s.userId}
              className="flex-row items-center justify-between border-b border-border py-2.5 last:border-0"
            >
              <View className="gap-0.5">
                <Text className="text-base font-medium text-text">
                  {s.userId === expense.paidBy ? "Payer (Advanced funds)" : "Participant"}
                </Text>
                {s.percentage ? (
                  <Text className="text-xs text-muted">Share: {s.percentage}%</Text>
                ) : s.shares ? (
                  <Text className="text-xs text-muted">Weight: {s.shares} share(s)</Text>
                ) : null}
              </View>
              <Text className="text-base font-bold text-text">
                {formatAmount(s.amountOwed)}
              </Text>
            </View>
          ))}
        </Card>
      </View>

      {/* Full-Screen Receipt Preview Modal */}
      <Modal
        visible={receiptModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptModalOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/95 p-4">
          <Pressable
            onPress={() => setReceiptModalOpen(false)}
            className="absolute right-4 top-12 z-10 rounded-full bg-surface2 px-4 py-2"
          >
            <Text className="text-base font-bold text-text">Close ✕</Text>
          </Pressable>
          {expense.receiptUrl ? (
            <Image
              source={{ uri: expense.receiptUrl }}
              className="h-4/5 w-full rounded-2xl"
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>

      {/* Delete Confirmation Sheet */}
      <ConfirmSheet
        visible={deleteOpen}
        title="Delete Expense?"
        description="This will delete this expense record and reverse all corresponding balance debts in the group."
        rows={[
          { label: "Description", value: expense.description },
          { label: "Amount", value: formatAmount(expense.amount) },
        ]}
        confirmLabel="Delete Expense"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </ScrollView>
  );
}
