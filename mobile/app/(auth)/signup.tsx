import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth/AuthContext";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import { ApiError } from "../../src/api/client";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!name || !email || password.length < 8) {
      setError("Enter your name, email, and a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), name.trim(), password);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to sign up. Try again.",
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
            <Text className="text-3xl font-bold text-text">Create account</Text>
            <Text className="text-base text-muted">
              Start splitting and settling expenses with PayPilot.
            </Text>
          </View>

          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
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
            placeholder="At least 8 characters"
          />

          {error ? <Text className="text-sm text-danger">{error}</Text> : null}

          <Button title="Sign up" loading={loading} onPress={submit} />

          <View className="flex-row justify-center gap-1">
            <Text className="text-muted">Already have an account?</Text>
            <Link href="/(auth)/login" className="font-semibold text-primary">
              Log in
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
