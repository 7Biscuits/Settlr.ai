import React from "react";
import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ color, fontSize: 20 }}>{label}</Text>;
}

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#141a2a",
          borderTopColor: "#2a3450",
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#8b93a7",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon label="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color }) => <TabIcon label="👥" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color }) => <TabIcon label="💳" color={color} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color }) => <TabIcon label="✨" color={color} />,
        }}
      />
      {/* Detail routes live in the app group but are hidden from the tab bar. */}
      <Tabs.Screen name="groups/[id]" options={{ href: null }} />
      <Tabs.Screen name="groups/[id]/add-member" options={{ href: null }} />
      <Tabs.Screen name="groups/[id]/add-expense" options={{ href: null }} />
      <Tabs.Screen name="expense/[id]" options={{ href: null }} />
    </Tabs>
  );
}
