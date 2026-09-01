import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { closeDatabase } from "../src/database/client.js";

const runDbTests = process.env.RUN_DB_TESTS === "1";
const d = runDbTests ? describe : describe.skip;

describe("expense routes (unit / mock)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated expense update", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/expenses/00000000-0000-0000-0000-000000000000",
      payload: { description: "New Description" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects unauthenticated expense deletion", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/expenses/00000000-0000-0000-0000-000000000000",
    });
    expect(res.statusCode).toBe(401);
  });

  it("validates create expense category and split type payload", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "u@e.com" });
    const res = await app.inject({
      method: "POST",
      url: "/groups/00000000-0000-0000-0000-000000000000/expenses",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        description: "Dinner",
        amount: 5000,
        paidBy: "00000000-0000-0000-0000-000000000000",
        category: "food",
        splitType: "percentage",
        participants: [
          // Missing percentage field for percentage split
          { userId: "00000000-0000-0000-0000-000000000000" },
        ],
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("ValidationError");
  });
});

d("expense update and delete lifecycle (live DB)", () => {
  let app: FastifyInstance;
  const email1 = `exp1_${Date.now()}@example.com`;
  const email2 = `exp2_${Date.now()}@example.com`;
  let token1: string;
  let user1Id: string;
  let user2Id: string;
  let groupId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register user 1
    const u1 = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: email1, name: "Alice Exp", password: "password123" },
    });
    token1 = u1.json().token;
    user1Id = u1.json().user.id;

    // Register user 2
    const u2 = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: email2, name: "Bob Exp", password: "password123" },
    });
    user2Id = u2.json().user.id;

    // Create group
    const g = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${token1}` },
      payload: { name: "Dinner Club" },
    });
    groupId = g.json().group.id;

    // Add Bob
    await app.inject({
      method: "POST",
      url: `/groups/${groupId}/members`,
      headers: { authorization: `Bearer ${token1}` },
      payload: { email: email2 },
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDatabase();
  });

  it("creates an expense with category and percentage split", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${token1}` },
      payload: {
        description: "Italian Dinner",
        amount: 10000,
        paidBy: user1Id,
        category: "food",
        splitType: "percentage",
        participants: [
          { userId: user1Id, percentage: 60 },
          { userId: user2Id, percentage: 40 },
        ],
      },
    });
    expect(res.statusCode).toBe(201);
    const exp = res.json().expense;
    expect(exp.category).toBe("food");
    expect(exp.splitType).toBe("percentage");
    expect(exp.splits).toEqual([
      { userId: user1Id, amountOwed: 6000 },
      { userId: user2Id, amountOwed: 4000 },
    ]);
  });

  it("updates expense and recalculates balance allocations", async () => {
    // Create an initial expense
    const createRes = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${token1}` },
      payload: {
        description: "Cab Ride",
        amount: 4000,
        paidBy: user1Id,
        category: "transport",
        splitType: "equal",
        participants: [{ userId: user1Id }, { userId: user2Id }],
      },
    });
    const expId = createRes.json().expense.id;

    // Update expense to 6000 with shares
    const updateRes = await app.inject({
      method: "PATCH",
      url: `/expenses/${expId}`,
      headers: { authorization: `Bearer ${token1}` },
      payload: {
        description: "Cab Ride Premium",
        amount: 6000,
        category: "travel",
        splitType: "shares",
        participants: [
          { userId: user1Id, shares: 1 },
          { userId: user2Id, shares: 2 },
        ],
      },
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = updateRes.json().expense;
    expect(updated.description).toBe("Cab Ride Premium");
    expect(updated.category).toBe("travel");
    expect(updated.amount).toBe(6000);
    expect(updated.splits).toEqual([
      { userId: user1Id, amountOwed: 2000 },
      { userId: user2Id, amountOwed: 4000 },
    ]);
  });

  it("deletes an expense and reverses balance adjustments", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${token1}` },
      payload: {
        description: "Mistake Expense",
        amount: 8000,
        paidBy: user1Id,
        category: "shopping",
        splitType: "equal",
        participants: [{ userId: user1Id }, { userId: user2Id }],
      },
    });
    const expId = createRes.json().expense.id;

    const delRes = await app.inject({
      method: "DELETE",
      url: `/expenses/${expId}`,
      headers: { authorization: `Bearer ${token1}` },
    });
    expect(delRes.statusCode).toBe(204);

    // Verify expense is deleted
    const getRes = await app.inject({
      method: "GET",
      url: `/expenses/${expId}`,
      headers: { authorization: `Bearer ${token1}` },
    });
    expect(getRes.statusCode).toBe(404);
  });

  it("supports creating expense with receiptUrl and attaching receiptUrl", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${token1}` },
      payload: {
        description: "Hotel Bill with Receipt",
        amount: 15000,
        paidBy: user1Id,
        category: "travel",
        receiptUrl: "https://example.supabase.co/storage/v1/object/public/receipts/expenses/hotel.jpg",
        splitType: "equal",
        participants: [{ userId: user1Id }, { userId: user2Id }],
      },
    });
    expect(res.statusCode).toBe(201);
    const exp = res.json().expense;
    expect(exp.receiptUrl).toBe("https://example.supabase.co/storage/v1/object/public/receipts/expenses/hotel.jpg");

    // Test attaching a new receipt URL via POST /expenses/:id/receipt
    const attachRes = await app.inject({
      method: "POST",
      url: `/expenses/${exp.id}/receipt`,
      headers: { authorization: `Bearer ${token1}` },
      payload: {
        receiptUrl: "https://example.supabase.co/storage/v1/object/public/receipts/expenses/hotel_updated.jpg",
      },
    });
    expect(attachRes.statusCode).toBe(200);
    expect(attachRes.json().expense.receiptUrl).toBe(
      "https://example.supabase.co/storage/v1/object/public/receipts/expenses/hotel_updated.jpg",
    );
  });

  it("forbids non-owner non-payer member from editing or deleting an expense", async () => {
    // User1 (Alice) creates an expense
    const createRes = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${token1}` },
      payload: {
        description: "Alice Lunch",
        amount: 2000,
        paidBy: user1Id,
        splitType: "equal",
        participants: [{ userId: user1Id }, { userId: user2Id }],
      },
    });
    const expId = createRes.json().expense.id;

    // Login token for Bob (user 2, non-owner, non-payer)
    const bobLogin = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: email2, password: "password123" },
    });
    const bobToken = bobLogin.json().token;

    // Bob tries to update Alice's expense -> 403 Forbidden
    const bobUpdate = await app.inject({
      method: "PATCH",
      url: `/expenses/${expId}`,
      headers: { authorization: `Bearer ${bobToken}` },
      payload: { description: "Tampered by Bob" },
    });
    expect(bobUpdate.statusCode).toBe(403);

    // Bob tries to delete Alice's expense -> 403 Forbidden
    const bobDelete = await app.inject({
      method: "DELETE",
      url: `/expenses/${expId}`,
      headers: { authorization: `Bearer ${bobToken}` },
    });
    expect(bobDelete.statusCode).toBe(403);
  });
});


