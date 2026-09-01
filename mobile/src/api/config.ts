import Constants from "expo-constants";

/**
 * Resolves the backend base URL from Expo config. Override via app.json's
 * `extra.apiBaseUrl` or an EXPO_PUBLIC_API_BASE_URL env var. No secrets live
 * here — this is only the public API origin.
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "http://localhost:3000";
