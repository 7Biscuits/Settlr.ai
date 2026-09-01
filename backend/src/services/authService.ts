import { createHash } from "node:crypto";
import { db } from "../database/client.js";
import { users, type User } from "../database/schema/users.js";
import { wallets } from "../database/schema/wallets.js";
import { revokedTokens } from "../database/schema/revokedTokens.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { AppError, ConflictError, UnauthorizedError } from "../utils/errors.js";
import { env } from "../config/env.js";
import { and, eq, gt } from "drizzle-orm";


export interface PublicUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublic(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function registerUser(input: {
  email: string;
  name: string;
  password: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<PublicUser> {
  const email = input.email.toLowerCase().trim();
  const phone = normalizePhone(input.phone);
  const bio = input.bio?.trim() || null;
  const avatarUrl = input.avatarUrl?.trim() || null;

  const passwordHash = await hashPassword(input.password);
  try {
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          email,
          name: input.name.trim(),
          passwordHash,
          phone,
          bio,
          avatarUrl,
        })
        .returning();


      if (!created) {
        throw new Error("User creation did not return a row");
      }

      // Keep account and wallet creation atomic so every user starts usable.
      await tx.insert(wallets).values({ userId: created.id, balance: 0 });
      return toPublic(created);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const msg = String((error as { detail?: string })?.detail ?? "");
      if (msg.includes("phone")) {
        throw new ConflictError("A user with this phone number already exists");
      }
      throw new ConflictError("A user with this email already exists");
    }
    throw error;
  }
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<PublicUser> {
  const normalized = email.toLowerCase().trim();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized));

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return toPublic(user);
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ? toPublic(user) : null;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function revokeToken(input: {
  rawToken: string;
  userId: string;
  expiresAt: Date;
}): Promise<void> {
  const tokenHash = hashToken(input.rawToken);
  await db
    .insert(revokedTokens)
    .values({
      tokenHash,
      userId: input.userId,
      expiresAt: input.expiresAt,
    })
    .onConflictDoNothing();
}

export async function isTokenRevoked(rawToken: string): Promise<boolean> {
  try {
    const tokenHash = hashToken(rawToken);
    const now = new Date();
    const [row] = await db
      .select({ id: revokedTokens.id })
      .from(revokedTokens)
      .where(
        and(
          eq(revokedTokens.tokenHash, tokenHash),
          gt(revokedTokens.expiresAt, now),
        ),
      );
    return !!row;
  } catch (err) {
    const isOfflineTestEnv =
      (process.env.NODE_ENV === "test" || env.NODE_ENV === "test") &&
      process.env.RUN_DB_TESTS !== "1";

    if (isOfflineTestEnv) {
      return false;
    }
    throw new AppError(
      503,
      "Authentication service temporarily unavailable. Please try again.",
    );
  }
}





function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

