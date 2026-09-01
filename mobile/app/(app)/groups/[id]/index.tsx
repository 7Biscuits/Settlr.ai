import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getGroup } from "../../../../src/api/groups";
import { listExpenses } from "../../../../src/api/expenses";
import { getGroupBalances } from "../../../../src/api/balances";
import type {
  DirectedBalance,
  Expense,
  GroupDetail,
} from "../../../../src/api/types";
import { Card } from "../../../../src/components/Card";
import { Button } from "../../../../src/components/Button";
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

  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<DirectedBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [d, e, b] = await Promise.all([
        getGroup(id),
        listExpenses(id),
        getGroupBalances(id),
      ]);
      setDetail(d);
      setExpenses(e.expenses);
      setBalances(b.balances);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <LoadingState label="Loading group..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!detail) return <ErrorState message="Group not found" />;

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
        <View className="flex-1">
          <Button
            title="Add member"
            variant="secondary"
            onPress={() => router.push(`/(app)/groups/${id}/add-member`)}
          />
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-lg font-semibold text-text">Members</Text>
        <Card>
          {detail.members.map((m) => (
            <View
              key={m.id}
              className="flex-row justify-between border-b border-border py-2 last:border-0"
            >
              <Text className="text-text">{m.name}</Text>
              <Text className="text-sm text-muted">{m.email}</Text>
            </View>
          ))}
        </Card>
      </View>

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
    </ScrollView>
  );
}
