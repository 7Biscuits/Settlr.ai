import { db } from "../database/client.js";
import { users, type User } from "../database/schema/users.js";
import { wallets } from "../database/schema/wallets.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";
import { eq } from "drizzle-orm";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

function toPublic(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}

export async function registerUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<PublicUser> {
  const email = input.email.toLowerCase().trim();

  const passwordHash = await hashPassword(input.password);
  try {
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({ email, name: input.name.trim(), passwordHash })
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

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}
