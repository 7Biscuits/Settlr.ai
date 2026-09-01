import "../global.css";
import React, { useEffect } from "react";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { AuthProvider, useAuth } from "../src/auth/AuthContext";
import { LoadingState } from "../src/components/States";
import {
  setPendingInvitationToken,
  takePendingInvitationToken,
} from "../src/api/session";

/**
 * Redirects between the (auth) and (app) route groups based on session state.
 * Unauthenticated users are pushed to login; authenticated users are kept in
 * the app group.
 */
function AuthGate() {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inviteToken = pathname.match(/^\/invite\/([^/]+)$/)?.[1];
    if (!user && !inAuthGroup) {
      if (inviteToken) {
        void setPendingInvitationToken(inviteToken);
      }
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      void takePendingInvitationToken().then((token) => {
        router.replace(token ? `/invite/${token}` : "/(app)/dashboard");
      });
    }
  }, [user, initializing, pathname, segments, router]);

  if (initializing) {
    return (
      <View className="flex-1 bg-bg">
        <LoadingState label="Starting PayPilot..." />
      </View>
    );
  }

  return (
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0b0f19" } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="invite/[token]" />
      </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AuthGate />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
