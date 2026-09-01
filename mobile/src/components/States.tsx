import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "./Button";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-8">
      <ActivityIndicator color="#3b82f6" size="large" />
      <Text className="text-muted">{label}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View className="items-center justify-center gap-3 p-8">
      <Text className="text-center text-danger">{message}</Text>
      {onRetry && <Button title="Retry" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="items-center justify-center gap-1 p-8">
      <Text className="text-center text-base font-medium text-text">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-center text-sm text-muted">{subtitle}</Text>
      )}
    </View>
  );
}
