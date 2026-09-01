import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getWalletBalance,
  listTransactions,
  topUp,
  newIdempotencyKey,
} from "../../src/api/wallet";
import type { Transaction } from "../../src/api/types";
import { Card } from "../../src/components/Card";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { ConfirmSheet } from "../../src/components/ConfirmSheet";
import { StatusBadge } from "../../src/components/StatusBadge";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../src/components/States";
import {
  formatAmount,
  parseAmountToMinor,
} from "../../src/lib/money";
import { ApiError } from "../../src/api/client";

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topupText, setTopupText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [b, t] = await Promise.all([
        getWalletBalance(),
        listTransactions(),
      ]);
      setBalance(b.balance);
      setTransactions(t.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const topupMinor = parseAmountToMinor(topupText);

  async function confirmTopUp() {
    if (!topupMinor) return;
    setSubmitting(true);
    setActionError(null);
    try {
      // Idempotency key ensures a retry never double-charges. The backend is
      // authoritative — we only reflect its returned balance.
      const res = await topUp(topupMinor, newIdempotencyKey("topup"));
      setBalance(res.balance);
      setTopupText("");
      setConfirmOpen(false);
      await load();
    } catch (err) {
      setConfirmOpen(false);
      setActionError(
        err instanceof ApiError ? err.message : "Top-up failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading wallet..." />;

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
      <Text className="text-2xl font-bold text-text">Wallet</Text>

      <Card>
        <Text className="text-sm text-muted">Available balance</Text>
        <Text className="mt-1 text-3xl font-bold text-text">
          {formatAmount(balance)}
        </Text>
      </Card>

      <Card className="gap-3">
        <Text className="text-base font-medium text-text">Add demo funds</Text>
        <Input
          value={topupText}
          onChangeText={setTopupText}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        {actionError ? (
          <Text className="text-sm text-danger">{actionError}</Text>
        ) : null}
        <Button
          title="Top up"
          disabled={!topupMinor}
          onPress={() => setConfirmOpen(true)}
        />
      </Card>

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      <View className="gap-2">
        <Text className="text-lg font-semibold text-text">Transactions</Text>
        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            subtitle="Top up or settle a debt to see activity here."
          />
        ) : (
          transactions.map((t) => (
            <Card key={t.id}>
              <View className="flex-row items-center justify-between">
                <View className="gap-1">
                  <Text className="text-base capitalize text-text">
                    {t.type}
                  </Text>
                  <StatusBadge status={t.status} />
                </View>
                <Text className="text-base font-medium text-text">
                  {formatAmount(t.amount)}
                </Text>
              </View>
            </Card>
          ))
        )}
      </View>

      <ConfirmSheet
        visible={confirmOpen}
        title="Confirm top-up"
        description="This adds demo funds to your wallet via the backend sandbox flow."
        rows={[
          {
            label: "Amount",
            value: topupMinor ? formatAmount(topupMinor) : "-",
          },
        ]}
        confirmLabel="Add funds"
        loading={submitting}
        onConfirm={confirmTopUp}
        onCancel={() => setConfirmOpen(false)}
      />
    </ScrollView>
  );
}
