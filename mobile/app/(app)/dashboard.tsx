import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth/AuthContext";
import { getDashboard } from "../../src/api/dashboard";
import type { DashboardSummary } from "../../src/api/types";
import { formatAmount, formatAbsAmount } from "../../src/lib/money";
import { Card } from "../../src/components/Card";
import { Button } from "../../src/components/Button";
import { LoadingState, ErrorState } from "../../src/components/States";

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSummary(await getDashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <LoadingState label="Loading your dashboard..." />;
  if (!summary) return <ErrorState message="Dashboard data is unavailable" onRetry={load} />;

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
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-muted">Welcome back</Text>
          <Text className="text-2xl font-bold text-text">
            {user?.name ?? "there"}
          </Text>
        </View>
        <Button title="Log out" variant="ghost" onPress={signOut} />
      </View>

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Text className="text-sm text-muted">You are owed</Text>
          <Text className="mt-1 text-xl font-bold text-success">
            {formatAbsAmount(summary.totalOwed)}
          </Text>
        </Card>
        <Card className="flex-1">
          <Text className="text-sm text-muted">You owe</Text>
          <Text className="mt-1 text-xl font-bold text-danger">
            {formatAbsAmount(summary.totalOwing)}
          </Text>
        </Card>
      </View>

      <Card>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-muted">Wallet balance</Text>
            <Text className="mt-1 text-2xl font-bold text-text">
              {formatAmount(summary.walletBalance)}
            </Text>
          </View>
          <Button
            title="Open wallet"
            variant="secondary"
            onPress={() => router.push("/(app)/wallet")}
          />
        </View>
      </Card>

      <Card>
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-text">Ask PayPilot</Text>
        </View>
        <Text className="mb-3 text-sm text-muted">
          Try “How much do I owe Rahul?” or “Settle everything I owe Rahul.”
        </Text>
        <Button
          title="Open assistant"
          onPress={() => router.push("/(app)/assistant")}
        />
      </Card>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-text">Your groups</Text>
          <Button
            title="See all"
            variant="ghost"
            onPress={() => router.push("/(app)/groups")}
          />
        </View>
        {summary.groups.length === 0 ? (
          <Card>
            <Text className="text-sm text-muted">
              No groups yet. Create one to start splitting expenses.
            </Text>
          </Card>
        ) : (
          summary.groups.slice(0, 4).map((g) => (
            <Card key={g.id}>
              <Text
                className="text-base font-medium text-text"
                onPress={() => router.push(`/(app)/groups/${g.id}`)}
              >
                {g.name}
              </Text>
            </Card>
          ))
        )}
      </View>

      <View className="gap-2">
        <Text className="text-lg font-semibold text-text">Recent activity</Text>
        {summary.recentActivity.length === 0 ? (
          <Card>
            <Text className="text-sm text-muted">No transactions yet.</Text>
          </Card>
        ) : (
          summary.recentActivity.map((t) => (
            <Card key={t.id}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base capitalize text-text">{t.type}</Text>
                <Text className="text-base font-medium text-text">
                  {formatAmount(t.amount)}
                </Text>
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
