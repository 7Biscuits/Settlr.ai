import React, { useCallback, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth/AuthContext";
import { getDashboard } from "../../src/api/dashboard";
import { getHealthStatus } from "../../src/api/health";
import { useMessageEvents } from "../../src/features/messages/useMessageEvents";
import type { DashboardSummary, HealthStatus } from "../../src/api/types";
import { formatAmount, formatAbsAmount } from "../../src/lib/money";
import { Card } from "../../src/components/Card";
import { Button } from "../../src/components/Button";
import { LoadingState, ErrorState } from "../../src/components/States";

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useMessageEvents();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [dash, h] = await Promise.all([
        getDashboard(),
        getHealthStatus().catch(() => ({ status: "degraded", database: "offline", timestamp: "" })),
      ]);
      setSummary(dash);
      setHealth(h);
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
      {/* Top Bar with Profile and Server Health */}
      <View className="flex-row items-center justify-between">
        <View className="gap-0.5">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-muted">Welcome back</Text>
            <View className="flex-row items-center gap-1 rounded-full bg-surface2 px-2 py-0.5">
              <View
                className={`h-2 w-2 rounded-full ${
                  health?.status === "ok" ? "bg-success" : "bg-warning"
                }`}
              />
              <Text className="text-[10px] text-muted capitalize">
                {health?.status === "ok" ? "Online" : "Connecting"}
              </Text>
            </View>
          </View>
          <Text className="text-2xl font-bold text-text">
            {user?.name ?? "there"}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/(app)/profile")}
          className="flex-row items-center gap-2 rounded-full border border-border bg-surface2 p-1 pr-3 active:opacity-80"
        >
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              className="h-9 w-9 rounded-full bg-surface"
            />
          ) : (
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/20">
              <Text className="text-sm font-bold text-primary">
                {(user?.name ?? "U").slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <Text className="text-xs font-semibold text-text">Profile</Text>
        </Pressable>
      </View>

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {/* Debt Summary Cards */}
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

      {/* Messages Quick Card */}
      <Card className="flex-row items-center justify-between bg-surface2">
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-text">Direct Messages</Text>
            {unreadCount > 0 ? (
              <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5">
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount} new
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-xs text-muted">
            {unreadCount > 0
              ? `You have ${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
              : "Chat with registered users & contacts"}
          </Text>
        </View>
        <Button
          title="Open chat"
          variant="secondary"
          onPress={() => router.push("/(app)/messages")}
        />
      </Card>

      {/* Wallet Balance Card */}
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

      {/* Assistant Entry Card */}
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

      {/* Groups Section */}
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

      {/* Recent Activity Section */}
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
