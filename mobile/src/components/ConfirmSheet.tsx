import React from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { Button } from "./Button";

interface Row {
  label: string;
  value: string;
}

/**
 * Reusable confirmation modal shown before any sensitive/financial action.
 * The action is only performed by the caller's `onConfirm` (which calls the
 * backend); this component never assumes success.
 */
export function ConfirmSheet({
  visible,
  title,
  description,
  rows,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  description?: string;
  rows?: Row[];
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="rounded-t-3xl border-t border-border bg-surface p-5">
          <Text className="mb-1 text-lg font-bold text-text">{title}</Text>
          {description ? (
            <Text className="mb-3 text-sm text-muted">{description}</Text>
          ) : null}

          {rows && rows.length > 0 ? (
            <ScrollView className="mb-4 max-h-60 rounded-xl bg-surface2 p-3">
              {rows.map((r) => (
                <View
                  key={r.label}
                  className="flex-row justify-between py-1"
                >
                  <Text className="text-sm text-muted">{r.label}</Text>
                  <Text className="text-sm font-medium text-text">
                    {r.value}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <View className="gap-2">
            <Button
              title={confirmLabel}
              variant={destructive ? "danger" : "primary"}
              loading={loading}
              onPress={onConfirm}
            />
            <Button title="Cancel" variant="ghost" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
