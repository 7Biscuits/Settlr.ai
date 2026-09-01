import { findContactsByName, type DeviceContact } from "../../lib/contacts";

/**
 * Detects a local "invite <name> to ..." intent in a spoken/typed command so
 * the app can resolve the person from on-device contacts and launch the native
 * invite flow. This is UI convenience only — it does not perform any financial
 * action and does not upload contacts.
 *
 * Returns the extracted name when the command looks like an invite, else null.
 */
export function parseInviteName(command: string): string | null {
  const m = command
    .toLowerCase()
    .match(/invite\s+([a-z][a-z .'-]*?)(?:\s+to\b|\s+into\b|$)/i);
  if (!m) return null;
  const name = m[1]?.trim();
  return name && name.length > 0 ? name : null;
}

export interface InviteResolution {
  name: string;
  matches: DeviceContact[];
}

/**
 * Resolves an invite name against device contacts. When multiple contacts share
 * the name, all matches are returned so the UI can prompt the user to choose.
 */
export async function resolveInviteContacts(
  name: string,
): Promise<InviteResolution> {
  const matches = await findContactsByName(name);
  return { name, matches };
}
