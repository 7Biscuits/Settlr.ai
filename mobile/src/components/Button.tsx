import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost";

interface Props extends PressableProps {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

const base =
  "flex-row items-center justify-center rounded-xl px-4 py-3 active:opacity-80";

const variantStyles: Record<Variant, string> = {
  primary: "bg-primary",
  secondary: "bg-surface2 border border-border",
  danger: "bg-danger",
  success: "bg-success",
  ghost: "bg-transparent",
};

const textStyles: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-text",
  danger: "text-white",
  success: "text-white",
  ghost: "text-primary",
};

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`${base} ${variantStyles[variant]} ${
        isDisabled ? "opacity-50" : ""
      }`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#e6e8ee" : "#fff"} />
      ) : (
        <Text className={`text-base font-semibold ${textStyles[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
