import React from "react";
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#151C8A" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="groups/index" />
      <Stack.Screen name="groups/[id]/index" />
      <Stack.Screen name="groups/[id]/add-expense" />
      <Stack.Screen name="groups/[id]/add-member" />
      <Stack.Screen name="messages/index" />
      <Stack.Screen name="messages/[id]" />
      <Stack.Screen name="messages/new" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="assistant" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="expense/[id]" />
      <Stack.Screen name="expense/edit/[id]" />
    </Stack>
  );
}
