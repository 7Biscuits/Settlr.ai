import { db } from "../database/client.js";
import { users } from "../database/schema/users.js";
import { toPublic, normalizePhone, type PublicUser } from "./authService.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import { and, eq, inArray, or, ilike } from "drizzle-orm";
import type {
  UpdateProfileInput,
  SingleLookupInput,
  ContactsLookupInput,
} from "../schemas/userSchemas.js";

export async function getUserProfile(userId: string): Promise<PublicUser> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return toPublic(user);
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  const updates: Partial<{
    name: string;
    phone: string | null;
    avatarUrl: string | null;
    bio: string | null;
    updatedAt: Date;
  }> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    updates.name = input.name.trim();
  }
  if (input.phone !== undefined) {
    updates.phone = normalizePhone(input.phone);
  }
  if (input.avatarUrl !== undefined) {
    updates.avatarUrl = input.avatarUrl;
  }
  if (input.bio !== undefined) {
    updates.bio = input.bio ? input.bio.trim() : null;
  }

  try {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      throw new NotFoundError("User not found");
    }
    return toPublic(updated);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("A user with this phone number already exists");
    }
    throw error;
  }
}

export async function lookupUserByContact(
  input: SingleLookupInput,
): Promise<ContactMatchUser | null> {
  if (input.phone) {
    const normalizedPhone = normalizePhone(input.phone);
    if (normalizedPhone) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.phone, normalizedPhone));
      if (user) return toContactMatch(user);
    }
  }

  if (input.email) {
    const normalizedEmail = input.email.toLowerCase().trim();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));
    if (user) return toContactMatch(user);
  }

  if (input.query) {
    const q = input.query.trim();
    const normalizedPhone = normalizePhone(q);
    const normalizedEmail = q.toLowerCase();

    // Check exact phone, exact email, or name match
    const conditions = [
      eq(users.email, normalizedEmail),
      ilike(users.name, q),
    ];
    if (normalizedPhone) {
      conditions.push(eq(users.phone, normalizedPhone));
    }

    const [user] = await db
      .select()
      .from(users)
      .where(or(...conditions));
    if (user) return toContactMatch(user);
  }

  return null;
}


export interface ContactMatchUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export function toContactMatch(user: {
  id: string;
  name: string;
  avatarUrl?: string | null;
}): ContactMatchUser {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
  };
}

export interface ContactsLookupResult {
  matched: ContactMatchUser[];
  unmatchedPhones: string[];
  unmatchedEmails: string[];
}

export async function bulkLookupContacts(
  input: ContactsLookupInput,
): Promise<ContactsLookupResult> {
  const normalizedPhones = (input.phones || [])
    .map((p) => normalizePhone(p))
    .filter((p): p is string => Boolean(p));

  const normalizedEmails = (input.emails || [])
    .map((e) => e.toLowerCase().trim())
    .filter((e) => e.length > 0);

  if (normalizedPhones.length === 0 && normalizedEmails.length === 0) {
    return { matched: [], unmatchedPhones: [], unmatchedEmails: [] };
  }

  const queryConditions = [];
  if (normalizedPhones.length > 0) {
    queryConditions.push(inArray(users.phone, normalizedPhones));
  }
  if (normalizedEmails.length > 0) {
    queryConditions.push(inArray(users.email, normalizedEmails));
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      phone: users.phone,
      email: users.email,
    })
    .from(users)
    .where(or(...queryConditions));

  const matched: ContactMatchUser[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    avatarUrl: r.avatarUrl ?? null,
  }));

  const matchedPhoneSet = new Set(
    rows.map((m) => m.phone).filter((p): p is string => Boolean(p)),
  );
  const matchedEmailSet = new Set(
    rows.map((m) => m.email.toLowerCase()),
  );

  const unmatchedPhones = normalizedPhones.filter((p) => !matchedPhoneSet.has(p));
  const unmatchedEmails = normalizedEmails.filter((e) => !matchedEmailSet.has(e));

  return {
    matched,
    unmatchedPhones: Array.from(new Set(unmatchedPhones)),
    unmatchedEmails: Array.from(new Set(unmatchedEmails)),
  };
}


function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}
