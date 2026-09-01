import { lookupUser } from "../api/users";

export interface DeviceContact {
  id: string;
  name: string;
  phoneNumbers: string[];
  emails: string[];
  isRegistered?: boolean;
}

// In-memory cache of created custom contacts
const customContacts: DeviceContact[] = [];

/**
 * No device permission needed. Always returns true since PayPilot manages
 * contacts directly in-app without reading the OS address book.
 */
export async function ensureContactsPermission(): Promise<boolean> {
  return true;
}

/**
 * Creates or updates an in-app contact. Phone numbers and emails are optional.
 */
export function createLocalContact(
  name: string,
  phone?: string,
  email?: string,
  isRegistered = false,
  id?: string,
): DeviceContact {
  const existing = customContacts.find(
    (c) =>
      c.name.toLowerCase() === name.toLowerCase() ||
      (email && c.emails.includes(email)) ||
      (phone && c.phoneNumbers.includes(phone)),
  );

  if (existing) {
    if (phone && !existing.phoneNumbers.includes(phone)) {
      existing.phoneNumbers.push(phone);
    }
    if (email && !existing.emails.includes(email)) {
      existing.emails.push(email);
    }
    return existing;
  }

  const newContact: DeviceContact = {
    id: id || `contact_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    phoneNumbers: phone ? [phone.trim()] : [],
    emails: email ? [email.trim()] : [],
    isRegistered,
  };

  customContacts.unshift(newContact);
  return newContact;
}

/**
 * Searches contacts by query (name, email, or phone).
 * 1. Checks PayPilot backend for registered users.
 * 2. Checks local in-app created contacts.
 */
export async function searchContacts(query: string): Promise<DeviceContact[]> {
  const trimmed = query.trim();
  const results: DeviceContact[] = [];

  if (trimmed) {
    // 1. Check PayPilot backend
    try {
      const isEmail = trimmed.includes("@");
      const isPhone = /^[+\d\s()-]+$/.test(trimmed);
      const res = await lookupUser({
        email: isEmail ? trimmed : undefined,
        phone: !isEmail && isPhone ? trimmed : undefined,
        query: !isEmail && !isPhone ? trimmed : undefined,
      });

      if (res.user) {
        results.push({
          id: res.user.id,
          name: res.user.name,
          phoneNumbers: res.user.phone ? [res.user.phone] : [],
          emails: res.user.email ? [res.user.email] : [],
          isRegistered: true,
        });
      }
    } catch {
      // Ignore lookup failure if user is not found on server
    }
  }

  // 2. Include in-app created contacts matching query
  const lower = trimmed.toLowerCase();
  const matchedLocal = customContacts.filter(
    (c) =>
      !lower ||
      c.name.toLowerCase().includes(lower) ||
      c.emails.some((e) => e.toLowerCase().includes(lower)) ||
      c.phoneNumbers.some((p) => p.includes(lower)),
  );

  // Merge unique by ID
  const seen = new Set<string>(results.map((r) => r.id));
  for (const c of matchedLocal) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      results.push(c);
    }
  }

  return results;
}

/**
 * Finds contacts whose name matches `name` (case-insensitive).
 */
export async function findContactsByName(name: string): Promise<DeviceContact[]> {
  return searchContacts(name);
}
