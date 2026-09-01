import React, { useCallback, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";

import { getExpense, deleteExpense } from "../../../src/api/expenses";
import type { ExpenseWithSplits } from "../../../src/api/types";
import { ConfirmSheet } from "../../../src/components/ConfirmSheet";
import { LoadingState } from "../../../src/components/States";
import { formatAmount } from "../../../src/lib/money";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === "ios" ? 44 : 24);

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
  if (!expense) return <Text style={styles.errorText}>Expense not found</Text>;

  return (
    <View style={styles.safeArea}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor="#00F58D"
          />
        }>
        {/* Top Header Section */}
        <View style={[styles.topSection, { paddingTop: topInset + 4 }]}>
          <View style={styles.headerRow}>
            <Pressable hitSlop={14} onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>EXPENSE DETAILS</Text>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push(`/(app)/expense/edit/${expense.id}`)}
                style={styles.actionPill}>
                <Feather name="edit-2" size={16} color="#0F172A" />
              </Pressable>
              <Pressable
                onPress={() => setDeleteOpen(true)}
                style={styles.deletePill}>
                <Feather name="trash-2" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Amount Display */}
          <View style={styles.amountDisplay}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {expense.category || "GENERAL"}
              </Text>
            </View>
            <Text style={styles.amountText}>{formatAmount(expense.amount)}</Text>
            <Text style={styles.expenseDesc}>{expense.description}</Text>
          </View>
        </View>

        {/* Content Card */}
        <View style={styles.bottomCard}>
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Split Type</Text>
              <Text style={styles.infoValue}>{expense.splitType.toUpperCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date Logged</Text>
              <Text style={styles.infoValue}>
                {new Date(expense.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Splits Breakdown */}
          <View style={styles.splitsSection}>
            <Text style={styles.sectionTitle}>PARTICIPANT BREAKDOWN</Text>
            <View style={styles.splitsList}>
              {expense.splits.map((s) => (
                <View key={s.userId} style={styles.splitRow}>
                  <View style={styles.splitLeft}>
                    <Text style={styles.splitRole}>
                      {s.userId === expense.paidBy ? "Payer (Paid full)" : "Participant"}
                    </Text>
                    {s.percentage ? (
                      <Text style={styles.splitSub}>Share: {s.percentage}%</Text>
                    ) : s.shares ? (
                      <Text style={styles.splitSub}>Weight: {s.shares} share(s)</Text>
                    ) : null}
                  </View>
                  <Text style={styles.splitAmount}>{formatAmount(s.amountOwed)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Attached Receipt */}
          {expense.receiptUrl ? (
            <View style={styles.receiptSection}>
              <Text style={styles.sectionTitle}>ATTACHED RECEIPT</Text>
              <Pressable
                onPress={() => setReceiptModalOpen(true)}
                style={styles.receiptContainer}>
                <Image source={{ uri: expense.receiptUrl }} style={styles.receiptImg} />
                <View style={styles.tapToView}>
                  <Text style={styles.tapToViewText}>Tap to view full receipt 🔍</Text>
                </View>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Full Size Receipt Modal */}
      <Modal
        visible={receiptModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            onPress={() => setReceiptModalOpen(false)}
            style={styles.modalCloseButton}>
            <Text style={styles.modalCloseText}>Close ✕</Text>
          </Pressable>
          {expense.receiptUrl ? (
            <Image
              source={{ uri: expense.receiptUrl }}
              style={styles.modalImg}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>

      {/* Delete Confirmation Sheet */}
      <ConfirmSheet
        visible={deleteOpen}
        title="Delete Expense?"
        description="This will permanently delete this expense and revert all debt calculations."
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
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionPill: {
    backgroundColor: "#00F58D",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  deletePill: {
    backgroundColor: "#EF4444",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  amountDisplay: {
    alignItems: "center",
    gap: 6,
    marginVertical: 10,
  },
  categoryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryBadgeText: {
    color: "#00F58D",
    fontSize: 11,
    fontWeight: "900",
  },
  amountText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
  },
  expenseDesc: {
    color: "#CBD5E1",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    flex: 1,
    gap: 18,
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
  errorText: {
    color: "#DC2626",
    textAlign: "center",
    marginTop: 40,
  },
  infoCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 13.5,
    color: "#0F172A",
    fontWeight: "800",
  },
  splitsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  splitsList: {
    gap: 10,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  splitLeft: {
    gap: 2,
  },
  splitRole: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  splitSub: {
    fontSize: 12,
    color: "#64748B",
  },
  splitAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  receiptSection: {
    gap: 10,
  },
  receiptContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  receiptImg: {
    width: "100%",
    height: 180,
  },
  tapToView: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 8,
    alignItems: "center",
  },
  tapToViewText: {
    color: "#2738F5",
    fontSize: 12.5,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalCloseText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  modalImg: {
    width: "100%",
    height: "80%",
  },
});
