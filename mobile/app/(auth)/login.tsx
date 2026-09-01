import React, { useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { useAuth } from "../../src/auth/AuthContext";
import { OnboardingScreen } from "../../src/components/settlr/onboarding/OnboardingScreen";
import { SignUpFlow, SignUpData } from "../../src/components/settlr/signup/SignUpFlow";
import { SignUpSuccessScreen } from "../../src/components/settlr/signup/SignUpSuccessScreen";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type AuthFlowMode = "onboarding" | "signup" | "login" | "success";

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [flowMode, setFlowMode] = useState<AuthFlowMode>("onboarding");

  const handleRegister = async (data: SignUpData) => {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    if (!data.password) {
      throw new Error("Password is required");
    }
    await signUp(data.email, fullName, data.password, data.phone, data.bio);
    setFlowMode("success");
  };

  const handleLoginSubmit = async (email: string, password?: string) => {
    if (!password) {
      throw new Error("Password is required");
    }
    await signIn(email, password);
    router.replace("/(app)/dashboard");
  };


  return (
    <View style={styles.container}>
      <StatusBar style={flowMode === "onboarding" ? "dark" : "light"} />

      {/* 1. Onboarding 4-Slide Carousel */}
      {flowMode === "onboarding" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.fullScreen}>
          <OnboardingScreen
            onSignUp={() => setFlowMode("signup")}
            onLogin={() => setFlowMode("login")}
          />
        </Animated.View>
      )}

      {/* 2. Sign Up Multi-Step Flow */}
      {flowMode === "signup" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.fullScreen}>
          <SignUpFlow
            initialMode="signup"
            onComplete={handleRegister}
            onLoginSubmit={handleLoginSubmit}
            onClose={() => setFlowMode("onboarding")}
          />
        </Animated.View>
      )}

      {/* 3. Direct Login Flow */}
      {flowMode === "login" && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.fullScreen}>
          <SignUpFlow
            initialMode="login"
            onComplete={handleRegister}
            onLoginSubmit={handleLoginSubmit}
            onClose={() => setFlowMode("onboarding")}
          />
        </Animated.View>
      )}

      {/* 4. Celebration Success Screen */}
      {flowMode === "success" && (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
          style={styles.fullScreen}>
          <SignUpSuccessScreen
            onNext={() => router.replace("/(app)/dashboard")}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  fullScreen: {
    flex: 1,
  },
});
