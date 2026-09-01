import * as Contacts from "expo-contacts";

export interface DeviceContact {
  id: string;
  name: string;
  phoneNumbers: string[];
  emails: string[];
}

/**
 * Requests contacts permission and returns the granted state. We only read
 * contacts on-device when the user explicitly triggers a contact-based action;
 * the full address book is never uploaded to the backend.
 */
export async function ensureContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Searches on-device contacts by name. Returns a lightweight, normalized shape
 * with only the fields the app needs (name, phones, emails).
 */
export async function searchContacts(query: string): Promise<DeviceContact[]> {
  const { data } = await Contacts.getContactsAsync({
    fields: [
      Contacts.Fields.Name,
      Contacts.Fields.PhoneNumbers,
      Contacts.Fields.Emails,
    ],
    name: query || undefined,
  });

  return data
    .filter((c) => !!c.name)
    .map((c) => ({
      id: c.id ?? c.name ?? Math.random().toString(36),
      name: c.name ?? "Unknown",
      phoneNumbers: (c.phoneNumbers ?? [])
        .map((p) => p.number ?? "")
        .filter(Boolean),
      emails: (c.emails ?? []).map((e) => e.email ?? "").filter(Boolean),
    }));
}

/**
 * Finds contacts whose name matches `name` (case-insensitive). Used by the
 * voice-invite flow to resolve a spoken name like "Rahul". When more than one
 * match exists, the caller prompts the user to choose.
 */
export async function findContactsByName(
  name: string,
): Promise<DeviceContact[]> {
  const results = await searchContacts(name);
  const lower = name.toLowerCase().trim();
  const exact = results.filter((c) => c.name.toLowerCase().includes(lower));
  return exact.length > 0 ? exact : results;
}
