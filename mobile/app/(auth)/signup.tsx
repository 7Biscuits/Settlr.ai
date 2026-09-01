import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { useAuth } from "../../src/auth/AuthContext";
import { SignUpFlow, SignUpData } from "../../src/components/settlr/signup/SignUpFlow";
import { SignUpSuccessScreen } from "../../src/components/settlr/signup/SignUpSuccessScreen";

export default function SignupScreen() {
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const handleRegister = async (data: SignUpData) => {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    if (!data.password) {
      throw new Error("Password is required");
    }
    await signUp(data.email, fullName, data.password, data.phone, data.bio);
    setSuccess(true);
  };

  const handleLoginSubmit = async (email: string, password?: string) => {
    if (!password) {
      throw new Error("Password is required");
    }
    await signIn(email, password);
    router.replace("/(app)/dashboard");
  };


  if (success) {
    return (
      <SignUpSuccessScreen
        onNext={() => router.replace("/(app)/dashboard")}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SignUpFlow
        initialMode="signup"
        onComplete={handleRegister}
        onLoginSubmit={handleLoginSubmit}
        onClose={() => router.replace("/(auth)/login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2738F5",
  },
});
