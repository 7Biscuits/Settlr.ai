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

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    throw new ConflictError("A user with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const [created] = await db
    .insert(users)
    .values({ email, name: input.name, passwordHash })
    .returning();

  // Every user gets a wallet with a zero balance.
  await db
    .insert(wallets)
    .values({ userId: created!.id, balance: 0 })
    .onConflictDoNothing();

  return toPublic(created!);
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
