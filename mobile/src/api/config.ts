import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Automatically discovers the host machine's IP address in development so that
 * physical devices, simulators, and Android emulators connect seamlessly to the
 * backend server on port 3000 without manual configuration.
 */
function getDevServerHost(): string {
  // Expo Host URI (e.g. "172.16.45.209:8081" on physical devices / Expo Go)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return ip;
    }
  }

  // Android Emulator uses 10.0.2.2 to reach the host computer's localhost
  if (Platform.OS === "android") {
    return "10.0.2.2";
  }

  // iOS Simulator / Web default
  return "localhost";
}

function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  const explicitConfig = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  if (explicitConfig && explicitConfig !== "http://localhost:3000") {
    return explicitConfig;
  }

  const host = getDevServerHost();
  return `http://${host}:3000`;
}

export const API_BASE_URL: string = resolveApiBaseUrl();
