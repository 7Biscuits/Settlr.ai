import React from "react";
import {
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function Input({ label, error, className = "", ...rest }: Props) {
  return (
    <View className="gap-1">
      {label && <Text className="text-sm text-muted">{label}</Text>}
      <TextInput
        placeholderTextColor="#6b7280"
        className={`rounded-xl border border-border bg-surface2 px-3 py-3 text-base text-text ${className}`}
        {...rest}
      />
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
