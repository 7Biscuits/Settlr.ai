import React from "react";
import { Redirect } from "expo-router";

// Entry point simply forwards to the app group; the AuthGate in the root
// layout handles redirecting to login when there is no session.
export default function Index() {
  return <Redirect href="/(app)/dashboard" />;
}
