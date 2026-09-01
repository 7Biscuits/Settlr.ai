import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth/AuthContext";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import { ApiError } from "../../src/api/client";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to log in. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        style={{ paddingTop: insets.top }}
      >
        <View className="gap-5 p-6">
          <View className="gap-1">
            <Text className="text-3xl font-bold text-text">PayPilot</Text>
            <Text className="text-base text-muted">
              Log in to manage shared expenses and settle up.
            </Text>
          </View>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Your password"
          />

          {error ? <Text className="text-sm text-danger">{error}</Text> : null}

          <Button title="Log in" loading={loading} onPress={submit} />

          <View className="flex-row justify-center gap-1">
            <Text className="text-muted">No account?</Text>
            <Link href="/(auth)/signup" className="font-semibold text-primary">
              Sign up
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
