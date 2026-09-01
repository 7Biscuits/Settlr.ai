import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { useAuth } from "../../src/auth/AuthContext";
import { getDashboard } from "../../src/api/dashboard";
import { getHealthStatus } from "../../src/api/health";
import { BorrowScreen } from "../../src/components/settlr/BorrowScreen";
import { BottomTabs, TabKey } from "../../src/components/settlr/BottomTabs";
import { BudgetScreen } from "../../src/components/settlr/BudgetScreen";
import { ChatScreen } from "../../src/components/settlr/ChatScreen";
import { HabitsScreen } from "../../src/components/settlr/HabitsScreen";
import { SaveScreen } from "../../src/components/settlr/SaveScreen";
import { SettingsModal } from "../../src/components/settlr/settings/SettingsModal";
import { SpendScreen } from "../../src/components/settlr/SpendScreen";
import { UserLookupModal } from "../../src/components/UserLookupModal";
import type { DashboardSummary, HealthStatus } from "../../src/api/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const INITIAL_WIDTH = SCREEN_WIDTH > 500 ? 440 : SCREEN_WIDTH;

const TAB_KEYS: TabKey[] = [
  "spend",
  "budget",
  "chat",
  "save",
  "borrow",
  "habits",
];

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("spend");
  const [containerWidth, setContainerWidth] = useState(INITIAL_WIDTH);
  const [showSettings, setShowSettings] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);

  // Backend Data
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [dash, h] = await Promise.all([
        getDashboard().catch(() => null),
        getHealthStatus().catch(() => ({ status: "degraded", database: "offline", timestamp: "" })),
      ]);
      if (dash) setSummary(dash);
      if (h) setHealth(h);
    } catch {
      // Graceful fallback to default values
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeIndex = TAB_KEYS.indexOf(activeTab);
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(-activeIndex * containerWidth, {
      damping: 24,
      stiffness: 240,
      mass: 0.85,
    });
  }, [activeIndex, containerWidth]);

  const animatedTrackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedBgStyle = useAnimatedStyle(() => {
    const progress =
      containerWidth > 0 ? -translateX.value / containerWidth : activeIndex;
    const bg = interpolateColor(
      progress,
      [0, 1, 1.8, 2, 2.2, 3, 4, 5],
      [
        "#151C8A", // 0: spend
        "#151C8A", // 1: budget
        "#EDF4FF", // near chat
        "#EDF4FF", // 2: chat
        "#EDF4FF", // near chat
        "#151C8A", // 3: save
        "#151C8A", // 4: borrow
        "#151C8A", // 5: habits
      ]
    );
    return {
      backgroundColor: bg,
    };
  });

  const isLightStatusBar = activeTab !== "chat";
  const openSettings = () => setShowSettings(true);

  return (
    <Animated.View style={[styles.outerContainer, animatedBgStyle]}>
      <StatusBar style={isLightStatusBar ? "light" : "dark"} />

      <Animated.View
        style={[styles.phoneContainer, animatedBgStyle]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - containerWidth) > 1) {
            setContainerWidth(w);
          }
        }}>
        {/* Sliding Viewport */}
        <View style={styles.viewportContainer}>
          <Animated.View
            style={[
              styles.slidingTrack,
              { width: containerWidth * TAB_KEYS.length },
              animatedTrackStyle,
            ]}>
            {/* 1. Spend Screen */}
            <View style={{ width: containerWidth, height: "100%" }}>
              <SpendScreen
                onOpenSettings={openSettings}
                onOpenTopUp={() => router.push("/(app)/wallet")}
                balance={summary?.walletBalance ?? 1274.87}
              />
            </View>

            {/* 2. Groups & Budget Screen */}
            <View style={{ width: containerWidth, height: "100%" }}>
              <BudgetScreen
                onOpenSettings={openSettings}
                onCreateGroup={() => router.push("/(app)/groups")}
                onSettleDebt={() => router.push("/(app)/wallet")}
                netBalance={
                  (summary?.totalOwed ?? 326) - (summary?.totalOwing ?? 188) + 1000
                }
                totalOwed={summary?.totalOwed ?? 326}
                totalOwing={summary?.totalOwing ?? 188}
              />
            </View>

            {/* 3. Settlr AI Assistant Chat Screen */}
            <View style={{ width: containerWidth, height: "100%" }}>
              <ChatScreen
                onOpenSettings={openSettings}
                onVoiceRecord={() => router.push("/(app)/assistant")}
              />
            </View>

            {/* 4. Vault & Save Screen */}
            <View style={{ width: containerWidth, height: "100%" }}>
              <SaveScreen
                onOpenSettings={openSettings}
                onTopUp={() => router.push("/(app)/wallet")}
                savedAmount={summary?.walletBalance ?? 1420.50}
                targetAmount={2000.00}
              />
            </View>

            {/* 5. Direct Transfers & Borrow Screen */}
            <View style={{ width: containerWidth, height: "100%" }}>
              <BorrowScreen
                onOpenSettings={openSettings}
                onSendTransfer={() => setShowLookupModal(true)}
              />
            </View>

            {/* 6. Habits & Splits Screen */}
            <View style={{ width: containerWidth, height: "100%" }}>
              <HabitsScreen
                onOpenSettings={openSettings}
                onAddExpense={() => router.push("/(app)/groups")}
              />
            </View>
          </Animated.View>
        </View>

        {/* Global Bottom Tab Bar */}
        <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </Animated.View>

      {/* Global Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={async () => {
          setShowSettings(false);
          await signOut();
          router.replace("/(auth)/login");
        }}
        userName={user?.name ?? "Alex Johnson"}
        userEmail={user?.email ?? "alex.johnson@settlr.ai"}
        userPhone={user?.phone ?? undefined}
        backendOnline={health?.status === "ok"}
      />

      {/* User Lookup Modal for P2P Transfers */}
      <UserLookupModal
        visible={showLookupModal}
        onCancel={() => setShowLookupModal(false)}
        onSelect={(selectedUser) => {
          setShowLookupModal(false);
          router.push({
            pathname: "/(app)/messages/new",
            params: { targetUserId: selectedUser.id, targetUserName: selectedUser.name },
          });
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneContainer: {
    flex: 1,
    width: "100%",
    maxWidth: SCREEN_WIDTH > 500 ? 440 : "100%",
    overflow: "hidden",
  },
  viewportContainer: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  slidingTrack: {
    flexDirection: "row",
    height: "100%",
  },
});
