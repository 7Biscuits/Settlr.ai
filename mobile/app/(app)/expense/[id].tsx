import React, { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getExpense } from "../../../src/api/expenses";
import type { ExpenseWithSplits } from "../../../src/api/types";
import { Card } from "../../../src/components/Card";
import { LoadingState, ErrorState } from "../../../src/components/States";
import { formatAmount } from "../../../src/lib/money";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [expense, setExpense] = useState<ExpenseWithSplits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { expense } = await getExpense(id);
      setExpense(expense);
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

  if (loading) return <LoadingState label="Loading expense..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!expense) return <ErrorState message="Expense not found" />;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <View className="gap-1">
        <Text className="text-sm text-muted">Expense</Text>
        <Text className="text-2xl font-bold text-text">
          {expense.description}
        </Text>
        <Text className="text-lg text-text">{formatAmount(expense.amount)}</Text>
        <Text className="text-xs capitalize text-muted">
          {expense.splitType} split
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-lg font-semibold text-text">Split breakdown</Text>
        <Card>
          {expense.splits.map((s) => (
            <View
              key={s.userId}
              className="flex-row justify-between border-b border-border py-2"
            >
              <Text className="text-text">
                {s.userId === expense.paidBy ? "Payer" : "Participant"}
              </Text>
              <Text className="text-text">{formatAmount(s.amountOwed)}</Text>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
