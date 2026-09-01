import { db, closeDatabase } from "./client.js";
import { users } from "./schema/users.js";
import { groups } from "./schema/groups.js";
import { groupMembers } from "./schema/groupMembers.js";
import { expenses } from "./schema/expenses.js";
import { expenseSplits } from "./schema/expenseSplits.js";
import { wallets } from "./schema/wallets.js";
import { transactions } from "./schema/transactions.js";
import { conversations } from "./schema/conversations.js";
import { directMessages } from "./schema/directMessages.js";
import { groupInvitations } from "./schema/groupInvitations.js";
import { agentActionProposals } from "./schema/agentActionProposals.js";
import { revokedTokens } from "./schema/revokedTokens.js";
import { settlements } from "./schema/settlements.js";
import { balances } from "./schema/balances.js";
import { hashPassword } from "../utils/password.js";

/**
 * Seeds the database with the 4 primary Settlr users:
 * 1. Shahil (shahil@settlr.ai)
 * 2. Rudransh (rudransh@settlr.ai)
 * 3. Rupam (rupam@settlr.ai)
 * 4. Kamal (kamal@settlr.ai)
 *
 * Password for all four: password123
 */
async function main() {
  console.log("Purging old demo data...");

  // Clean up in reverse foreign-key order
  await db.delete(agentActionProposals);
  await db.delete(groupInvitations);
  await db.delete(revokedTokens);
  await db.delete(directMessages);
  await db.delete(conversations);
  await db.delete(expenseSplits);
  await db.delete(expenses);
  await db.delete(balances);
  await db.delete(settlements);
  await db.delete(transactions);
  await db.delete(wallets);
  await db.delete(groupMembers);
  await db.delete(groups);
  await db.delete(users);


  console.log("Seeding the 4 primary Settlr users...");

  const passwordHash = await hashPassword("password123");

  const seedUsersData = [
    {
      email: "shahil@settlr.ai",
      name: "Shahil",
      phone: "+919876500001",
      bio: "Settlr co-founder & tech explorer 🚀",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Shahil",
      walletBalance: 7500000, // ₹75,000.00
    },
    {
      email: "rudransh@settlr.ai",
      name: "Rudransh",
      phone: "+919876500002",
      bio: "AI Engineer & systems builder 🤖",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Rudransh",
      walletBalance: 8500000, // ₹85,000.00
    },
    {
      email: "rupam@settlr.ai",
      name: "Rupam",
      phone: "+919876500003",
      bio: "Product designer & coffee aficionado ☕",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Rupam",
      walletBalance: 6000000, // ₹60,000.00
    },
    {
      email: "kamal@settlr.ai",
      name: "Kamal",
      phone: "+919876500004",
      bio: "Operations lead & road trip planner 🏖️",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Kamal",
      walletBalance: 5000000, // ₹50,000.00
    },
  ];

  const userMap: Record<string, { id: string; name: string; email: string }> = {};

  for (const u of seedUsersData) {
    const [row] = await db
      .insert(users)
      .values({
        email: u.email,
        name: u.name,
        passwordHash,
        phone: u.phone,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
      })
      .returning({ id: users.id, name: users.name, email: users.email });

    userMap[u.name] = row!;

    // Create wallet with initial balance
    await db.insert(wallets).values({
      userId: row!.id,
      balance: u.walletBalance,
    });

    // Record initial top-up transaction in wallet ledger
    await db.insert(transactions).values({
      type: "topup",
      fromUserId: null,
      toUserId: row!.id,
      amount: u.walletBalance,
      status: "completed",
      idempotencyKey: `seed-topup-${row!.id}`,
    });
  }

  console.log("Seeding groups & members...");

  // Group 1: Goa Roadtrip (all 4 users)
  const [goaGroup] = await db
    .insert(groups)
    .values({
      name: "Goa Roadtrip 🏖️",
      createdBy: userMap["Shahil"]!.id,
    })
    .returning({ id: groups.id });

  for (const [idx, name] of ["Shahil", "Rudransh", "Rupam", "Kamal"].entries()) {
    await db.insert(groupMembers).values({
      groupId: goaGroup!.id,
      userId: userMap[name]!.id,
      role: idx === 0 ? "owner" : "member",
    });
  }

  // Group 2: Flat 302 Expenses (Shahil, Rudransh, Rupam)
  const [flatGroup] = await db
    .insert(groups)
    .values({
      name: "Flat 302 Expenses 🏠",
      createdBy: userMap["Rudransh"]!.id,
    })
    .returning({ id: groups.id });

  for (const [idx, name] of ["Rudransh", "Shahil", "Rupam"].entries()) {
    await db.insert(groupMembers).values({
      groupId: flatGroup!.id,
      userId: userMap[name]!.id,
      role: idx === 0 ? "owner" : "member",
    });
  }

  console.log("Seeding group expenses and splits...");

  const { applyExpenseToBalances } = await import("../services/balanceService.js");

  // Expense 1: Beachside Villa in Goa (Shahil paid ₹16,000, split 4 ways = ₹4,000 each)
  const [exp1] = await db
    .insert(expenses)
    .values({
      groupId: goaGroup!.id,
      paidBy: userMap["Shahil"]!.id,
      description: "Beachside Villa Booking",
      amount: 1600000, // ₹16,000.00
      splitType: "equal",
      category: "travel",
    })
    .returning({ id: expenses.id });

  const exp1Splits = ["Shahil", "Rudransh", "Rupam", "Kamal"].map((name) => ({
    userId: userMap[name]!.id,
    amountOwed: 400000,
  }));
  for (const s of exp1Splits) {
    await db.insert(expenseSplits).values({
      expenseId: exp1!.id,
      userId: s.userId,
      amountOwed: s.amountOwed,
    });
  }
  await applyExpenseToBalances(db, {
    groupId: goaGroup!.id,
    paidBy: userMap["Shahil"]!.id,
    splits: exp1Splits,
  });

  // Expense 2: Highway Fuel & Tolls (Kamal paid ₹6,000, split 4 ways = ₹1,500 each)
  const [exp2] = await db
    .insert(expenses)
    .values({
      groupId: goaGroup!.id,
      paidBy: userMap["Kamal"]!.id,
      description: "Highway Fuel & Tolls",
      amount: 600000, // ₹6,000.00
      splitType: "equal",
      category: "transport",
    })
    .returning({ id: expenses.id });

  const exp2Splits = ["Shahil", "Rudransh", "Rupam", "Kamal"].map((name) => ({
    userId: userMap[name]!.id,
    amountOwed: 150000,
  }));
  for (const s of exp2Splits) {
    await db.insert(expenseSplits).values({
      expenseId: exp2!.id,
      userId: s.userId,
      amountOwed: s.amountOwed,
    });
  }
  await applyExpenseToBalances(db, {
    groupId: goaGroup!.id,
    paidBy: userMap["Kamal"]!.id,
    splits: exp2Splits,
  });

  // Expense 3: Seafood Shack Dinner (Rudransh paid ₹4,800, split 4 ways = ₹1,200 each)
  const [exp3] = await db
    .insert(expenses)
    .values({
      groupId: goaGroup!.id,
      paidBy: userMap["Rudransh"]!.id,
      description: "Seafood Shack Dinner",
      amount: 480000, // ₹4,800.00
      splitType: "equal",
      category: "food",
    })
    .returning({ id: expenses.id });

  const exp3Splits = ["Shahil", "Rudransh", "Rupam", "Kamal"].map((name) => ({
    userId: userMap[name]!.id,
    amountOwed: 120000,
  }));
  for (const s of exp3Splits) {
    await db.insert(expenseSplits).values({
      expenseId: exp3!.id,
      userId: s.userId,
      amountOwed: s.amountOwed,
    });
  }
  await applyExpenseToBalances(db, {
    groupId: goaGroup!.id,
    paidBy: userMap["Rudransh"]!.id,
    splits: exp3Splits,
  });

  // Expense 4: High-Speed WiFi in Flat 302 (Rupam paid ₹2,400, split 3 ways = ₹800 each)
  const [exp4] = await db
    .insert(expenses)
    .values({
      groupId: flatGroup!.id,
      paidBy: userMap["Rupam"]!.id,
      description: "High-Speed WiFi Bill",
      amount: 240000, // ₹2,400.00
      splitType: "equal",
      category: "utilities",
    })
    .returning({ id: expenses.id });

  const exp4Splits = ["Rudransh", "Shahil", "Rupam"].map((name) => ({
    userId: userMap[name]!.id,
    amountOwed: 80000,
  }));
  for (const s of exp4Splits) {
    await db.insert(expenseSplits).values({
      expenseId: exp4!.id,
      userId: s.userId,
      amountOwed: s.amountOwed,
    });
  }
  await applyExpenseToBalances(db, {
    groupId: flatGroup!.id,
    paidBy: userMap["Rupam"]!.id,
    splits: exp4Splits,
  });

  // Expense 5: Monthly Groceries in Flat 302 (Shahil paid ₹3,600, split 3 ways = ₹1,200 each)
  const [exp5] = await db
    .insert(expenses)
    .values({
      groupId: flatGroup!.id,
      paidBy: userMap["Shahil"]!.id,
      description: "Organic Groceries & Supplies",
      amount: 360000, // ₹3,600.00
      splitType: "equal",
      category: "food",
    })
    .returning({ id: expenses.id });

  const exp5Splits = ["Rudransh", "Shahil", "Rupam"].map((name) => ({
    userId: userMap[name]!.id,
    amountOwed: 120000,
  }));
  for (const s of exp5Splits) {
    await db.insert(expenseSplits).values({
      expenseId: exp5!.id,
      userId: s.userId,
      amountOwed: s.amountOwed,
    });
  }
  await applyExpenseToBalances(db, {
    groupId: flatGroup!.id,
    paidBy: userMap["Shahil"]!.id,
    splits: exp5Splits,
  });


  console.log("Seeding wallet transfer & settlement transactions...");

  // Transfer from Shahil to Kamal (₹1,000)
  await db.insert(transactions).values({
    type: "transfer",
    fromUserId: userMap["Shahil"]!.id,
    toUserId: userMap["Kamal"]!.id,
    amount: 100000, // ₹1,000.00
    status: "completed",
    idempotencyKey: `seed-transfer-shahil-kamal-${Date.now()}`,
  });

  // Direct Settlement from Rudransh to Kamal (₹1,500 for Fuel)
  await db.insert(transactions).values({
    type: "settlement",
    fromUserId: userMap["Rudransh"]!.id,
    toUserId: userMap["Kamal"]!.id,
    amount: 150000, // ₹1,500.00
    status: "completed",
    idempotencyKey: `seed-settle-rudransh-kamal-${Date.now()}`,
  });

  console.log("Seeding direct messages & conversations...");

  // Conversation 1: Shahil & Rudransh
  const [userA1, userB1] = [userMap["Shahil"]!.id, userMap["Rudransh"]!.id].sort();
  const [conv1] = await db
    .insert(conversations)
    .values({
      user1Id: userA1!,
      user2Id: userB1!,
      lastMessagePreview: "Hey, check the villa booking on Goa Roadtrip group!",
      lastMessageAt: new Date(),
    })
    .returning({ id: conversations.id });

  await db.insert(directMessages).values([
    {
      conversationId: conv1!.id,
      senderId: userMap["Shahil"]!.id,
      recipientId: userMap["Rudransh"]!.id,
      content: "Hey Rudransh, are we on track for the Goa trip?",
      messageType: "text",
      isRead: true,
    },
    {
      conversationId: conv1!.id,
      senderId: userMap["Rudransh"]!.id,
      recipientId: userMap["Shahil"]!.id,
      content: "Yes! Booked the dinner spots already.",
      messageType: "text",
      isRead: true,
    },
    {
      conversationId: conv1!.id,
      senderId: userMap["Shahil"]!.id,
      recipientId: userMap["Rudransh"]!.id,
      content: "Hey, check the villa booking on Goa Roadtrip group!",
      messageType: "text",
      isRead: false,
    },
  ]);

  // Conversation 2: Shahil & Kamal
  const [userA2, userB2] = [userMap["Shahil"]!.id, userMap["Kamal"]!.id].sort();
  const [conv2] = await db
    .insert(conversations)
    .values({
      user1Id: userA2!,
      user2Id: userB2!,
      lastMessagePreview: "Sent ₹1,000 for fuel advance ⚡",
      lastMessageAt: new Date(),
    })
    .returning({ id: conversations.id });

  await db.insert(directMessages).values([
    {
      conversationId: conv2!.id,
      senderId: userMap["Shahil"]!.id,
      recipientId: userMap["Kamal"]!.id,
      content: "Sent ₹1,000 for fuel advance ⚡",
      messageType: "text",
      isRead: false,
    },
  ]);

  // Conversation 3: Rudransh & Rupam
  const [userA3, userB3] = [userMap["Rudransh"]!.id, userMap["Rupam"]!.id].sort();
  const [conv3] = await db
    .insert(conversations)
    .values({
      user1Id: userA3!,
      user2Id: userB3!,
      lastMessagePreview: "Paid the WiFi bill for Flat 302 👍",
      lastMessageAt: new Date(),
    })
    .returning({ id: conversations.id });

  await db.insert(directMessages).values([
    {
      conversationId: conv3!.id,
      senderId: userMap["Rupam"]!.id,
      recipientId: userMap["Rudransh"]!.id,
      content: "Paid the WiFi bill for Flat 302 👍",
      messageType: "text",
      isRead: true,
    },
  ]);

  console.log("\n==========================================");
  console.log("Database successfully seeded with 4 users:");
  console.log("1. Shahil   - shahil@settlr.ai   (password123)");
  console.log("2. Rudransh - rudransh@settlr.ai (password123)");
  console.log("3. Rupam    - rupam@settlr.ai    (password123)");
  console.log("4. Kamal    - kamal@settlr.ai    (password123)");
  console.log("==========================================\n");

  await closeDatabase();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
