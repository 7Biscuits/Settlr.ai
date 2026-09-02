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
import { listConversations } from "../../src/api/messages";
import { BottomTabs, TabKey } from "../../src/components/settlr/BottomTabs";
import { BudgetScreen } from "../../src/components/settlr/BudgetScreen";
import { ChatScreen } from "../../src/components/settlr/ChatScreen";
import { SettingsModal } from "../../src/components/settlr/settings/SettingsModal";
import { SpendScreen } from "../../src/components/settlr/SpendScreen";
import { UserLookupModal } from "../../src/components/UserLookupModal";
import MessagesIndexScreen from "./messages/index";
import WalletScreen from "./wallet";
import type { DashboardSummary, HealthStatus } from "../../src/api/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const INITIAL_WIDTH = SCREEN_WIDTH > 500 ? 440 : SCREEN_WIDTH;

const TAB_KEYS: TabKey[] = [
  "home",
  "groups",
  "assistant",
  "messages",
  "wallet",
];

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [containerWidth, setContainerWidth] = useState(INITIAL_WIDTH);
  const [showSettings, setShowSettings] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Backend Data
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [dash, h, msgs] = await Promise.all([
        getDashboard().catch(() => null),
        getHealthStatus().catch(() => ({ status: "degraded", database: "offline", timestamp: "" })),
        listConversations().catch(() => null),
      ]);
      if (dash) setSummary(dash);
      if (h) setHealth(h);
      if (msgs) {
        const totalUnread = msgs.conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, activeTab]);


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
      [0, 1, 2, 3, 4],
      [
        "#151C8A", // 0: home
        "#151C8A", // 1: groups
        "#EDF4FF", // 2: assistant
        "#151C8A", // 3: messages
        "#151C8A", // 4: wallet
      ]
    );
    return {
      backgroundColor: bg,
    };
  });

  const isLightStatusBar = activeTab !== "assistant";
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
        {/* Sliding Viewport with 5 Relevant Settlr Tabs */}
        <View style={styles.viewportContainer}>
          <Animated.View
            style={[
              styles.slidingTrack,
              { width: containerWidth * TAB_KEYS.length },
              animatedTrackStyle,
            ]}>
            {/* 1. Home Dashboard Screen */}
            <View style={{ width: containerWidth, height: "100%" }}>
              <SpendScreen
                onOpenSettings={openSettings}
                onOpenTopUp={() => setActiveTab("wallet")}
                balance={summary?.walletBalance ?? 0}
                totalOwed={summary?.totalOwed ?? 0}
                totalOwing={summary?.totalOwing ?? 0}
                recentActivity={summary?.recentActivity ?? []}
              />
            </View>

            {/* 2. Groups & Split Screen */}
            <View style={{ width: containerWidth, height: "100%" }}>
              <BudgetScreen
                onOpenSettings={openSettings}
                onSelectGroup={(groupId) => router.push(`/(app)/groups/${groupId}`)}
                netBalance={
                  ((summary?.totalOwed ?? 0) - (summary?.totalOwing ?? 0)) / 100
                }
                totalOwed={(summary?.totalOwed ?? 0) / 100}
                totalOwing={(summary?.totalOwing ?? 0) / 100}
                groups={summary?.groups ?? []}
                onRefreshGroups={loadData}
              />
            </View>

            {/* 3. Settlr AI Assistant */}
            <View style={{ width: containerWidth, height: "100%" }}>
              <ChatScreen
                onOpenSettings={openSettings}
                onVoiceRecord={() => router.push("/(app)/assistant")}
              />
            </View>

            {/* 4. Direct Messages & Contact Chats */}
            <View style={{ width: containerWidth, height: "100%" }}>
              <MessagesIndexScreen />
            </View>

            {/* 5. Wallet & Direct Settlements */}
            <View style={{ width: containerWidth, height: "100%" }}>
              <WalletScreen />
            </View>
          </Animated.View>
        </View>

        {/* 5-Tab Settlr Animated Bottom Bar */}
        <BottomTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadMessagesCount={unreadCount}
        />
      </Animated.View>

      {/* Global Settings & Profile Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={async () => {
          setShowSettings(false);
          await signOut();
          router.replace("/(auth)/login");
        }}
        userName={user?.name ?? "User"}
        userEmail={user?.email ?? ""}
        userPhone={user?.phone ?? undefined}
        walletBalance={summary?.walletBalance ?? 0}
        backendOnline={health?.status === "ok"}
      />


      {/* User Lookup Modal for Direct Transfers */}

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
