import { db, closeDatabase } from "./client.js";
import { users } from "./schema/users.js";
import { groups } from "./schema/groups.js";
import { groupMembers } from "./schema/groupMembers.js";
import { wallets } from "./schema/wallets.js";
import { hashPassword } from "../utils/password.js";
import { eq } from "drizzle-orm";

/**
 * Seeds demo users, a shared group, and wallets so later phases and the
 * end-to-end demo have data to work with. Idempotent by email.
 */
async function main() {
  console.log("Seeding demo data...");

  const demoUsers = [
    { email: "alice@example.com", name: "Alice", password: "password123" },
    { email: "rahul@example.com", name: "Rahul", password: "password123" },
    { email: "bob@example.com", name: "Bob", password: "password123" },
  ];

  const insertedIds: string[] = [];

  for (const u of demoUsers) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, u.email));

    let userId: string;
    if (existing.length > 0) {
      userId = existing[0]!.id;
    } else {
      const passwordHash = await hashPassword(u.password);
      const [row] = await db
        .insert(users)
        .values({ email: u.email, name: u.name, passwordHash })
        .returning({ id: users.id });
      userId = row!.id;
      // Create a wallet with a starting demo balance.
      await db
        .insert(wallets)
        .values({ userId, balance: 100_000 })
        .onConflictDoNothing();
    }
    insertedIds.push(userId);
  }

  // Create a demo group owned by the first user if none exists.
  const existingGroups = await db.select().from(groups);
  if (existingGroups.length === 0) {
    const [group] = await db
      .insert(groups)
      .values({ name: "Goa Trip", createdBy: insertedIds[0]! })
      .returning({ id: groups.id });

    for (const [i, userId] of insertedIds.entries()) {
      await db
        .insert(groupMembers)
        .values({
          groupId: group!.id,
          userId,
          role: i === 0 ? "owner" : "member",
        })
        .onConflictDoNothing();
    }
    console.log(`Created demo group "Goa Trip" with ${insertedIds.length} members.`);
  }

  console.log("Seed complete.");
  await closeDatabase();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
