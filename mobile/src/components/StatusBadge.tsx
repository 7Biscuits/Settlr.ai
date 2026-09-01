import React from "react";
import { Text, View } from "react-native";

type Status = "pending" | "owed" | "payable" | "paid" | "failed" | "completed";

const styles: Record<Status, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-warning/20", text: "text-warning", label: "Pending" },
  owed: { bg: "bg-success/20", text: "text-success", label: "Owed to you" },
  payable: { bg: "bg-danger/20", text: "text-danger", label: "You owe" },
  paid: { bg: "bg-success/20", text: "text-success", label: "Paid" },
  completed: { bg: "bg-success/20", text: "text-success", label: "Completed" },
  failed: { bg: "bg-danger/20", text: "text-danger", label: "Failed" },
};

export function StatusBadge({ status }: { status: Status | string }) {
  const s = styles[status as Status] ?? {
    bg: "bg-surface2",
    text: "text-muted",
    label: status,
  };
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${s.bg}`}>
      <Text className={`text-xs font-medium ${s.text}`}>{s.label}</Text>
    </View>
  );
}
