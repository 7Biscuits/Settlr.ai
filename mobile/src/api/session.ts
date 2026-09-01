import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "paypilot_token";
const PENDING_INVITATION_KEY = "paypilot_pending_invitation";

/**
 * Session token persistence backed by the device secure store (Keychain /
 * Keystore). The JWT is the only credential stored client-side; no API keys or
 * secrets are ever kept in the app.
 */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/** Keeps an invite deep-link through the sign-in/sign-up flow. */
export async function setPendingInvitationToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(PENDING_INVITATION_KEY, token);
}

export async function takePendingInvitationToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(PENDING_INVITATION_KEY);
  await SecureStore.deleteItemAsync(PENDING_INVITATION_KEY);
  return token;
}
