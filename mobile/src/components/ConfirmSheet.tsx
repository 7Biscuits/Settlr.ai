import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
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
interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  description?: string;
  rows?: Row[];
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  muteTts?: boolean;
  onToggleMuteTts?: (muted: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  visible,
  title,
  description,
  rows,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  muteTts,
  onToggleMuteTts,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
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

          {onToggleMuteTts && (
            <Pressable
              onPress={() => onToggleMuteTts(!muteTts)}
              className="mb-4 flex-row items-center justify-between rounded-xl border border-border bg-surface2 p-3 active:opacity-75"
            >
              <Text className="text-sm font-medium text-text">
                {muteTts ? "🔇 Text to Speech Muted" : "🔊 Speak result after action"}
              </Text>
              <Text className={`text-xs font-bold ${muteTts ? "text-danger" : "text-primary"}`}>
                {muteTts ? "MUTED" : "ON"}
              </Text>
            </Pressable>
          )}

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

