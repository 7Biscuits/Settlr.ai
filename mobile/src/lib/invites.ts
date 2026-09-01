import * as SMS from "expo-sms";

/**
 * Sends an invitation message through the device's SMS composer. This uses the
 * native messaging UI — the user reviews and sends the message themselves; the
 * app never sends silently. Returns the composer result or a not-available
 * signal when the device cannot send SMS.
 */
export async function sendInviteSms(
  phoneNumbers: string[],
  message: string,
): Promise<"sent" | "cancelled" | "unavailable"> {
  const available = await SMS.isAvailableAsync();
  if (!available) return "unavailable";
  const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
  return result === "sent" ? "sent" : "cancelled";
}

export function buildInviteMessage(
  inviterName: string,
  groupName: string,
): string {
  return `Hi! ${inviterName} invited you to join the "${groupName}" group on PayPilot to split and settle shared expenses. Get the app to join.`;
}
