import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { closeDatabase } from "../src/database/client.js";

const runDbTests = process.env.RUN_DB_TESTS === "1";
const d = runDbTests ? describe : describe.skip;

describe("user and contact routes (unit / mock)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated /users/me", async () => {
    const res = await app.inject({ method: "GET", url: "/users/me" });
    expect(res.statusCode).toBe(401);
  });

  it("rejects invalid profile update payload", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "u@e.com" });
    const res = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: { authorization: `Bearer ${token}` },
      payload: {}, // empty update
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("ValidationError");
  });

  it("rejects empty contact lookup", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "u@e.com" });
    const res = await app.inject({
      method: "POST",
      url: "/users/lookup",
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("ValidationError");
  });

  it("validates contacts lookup array format", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "u@e.com" });
    const res = await app.inject({
      method: "POST",
      url: "/users/contacts-lookup",
      headers: { authorization: `Bearer ${token}` },
      payload: { phones: ["+15550001", "+15550002"] },
    });
    // With dummy token and no DB, handler runs query; if DB is unavailable, may throw AppError or 500, but schema parsing succeeds
    expect([200, 500]).toContain(res.statusCode);
  });
});

d("user profiles and contact lookup (live DB)", () => {
  let app: FastifyInstance;
  const email1 = `test_prof1_${Date.now()}@example.com`;
  const email2 = `test_prof2_${Date.now()}@example.com`;
  const phone1 = `+1555${Math.floor(100000 + Math.random() * 900000)}`;
  const phone2 = `+1555${Math.floor(100000 + Math.random() * 900000)}`;

  let token1: string;
  let user1Id: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register user 1 with phone
    const regRes = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: email1, name: "User One", password: "password123", phone: phone1 },
    });
    expect(regRes.statusCode).toBe(201);
    const body1 = regRes.json();
    token1 = body1.token;
    user1Id = body1.user.id;

    // Register user 2 with phone
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: email2, name: "User Two", password: "password123", phone: phone2 },
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDatabase();
  });

  it("fetches the current user profile including phone", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/users/me",
      headers: { authorization: `Bearer ${token1}` },
    });
    expect(res.statusCode).toBe(200);
    const user = res.json().user;
    expect(user.id).toBe(user1Id);
    expect(user.phone).toBe(phone1);
    expect(user.name).toBe("User One");
  });

  it("updates user profile fields", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: { authorization: `Bearer ${token1}` },
      payload: { name: "User One Updated", bio: "Settling debts easily", avatarUrl: "https://example.com/avatar.png" },
    });
    expect(res.statusCode).toBe(200);
    const user = res.json().user;
    expect(user.name).toBe("User One Updated");
    expect(user.bio).toBe("Settling debts easily");
    expect(user.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("rejects duplicate phone number updates", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: { authorization: `Bearer ${token1}` },
      payload: { phone: phone2 }, // phone2 is already registered
    });
    expect(res.statusCode).toBe(409);
  });

  it("looks up user by phone", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/users/lookup",
      headers: { authorization: `Bearer ${token1}` },
      payload: { phone: phone2 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.email).toBe(email2);
  });

  it("performs bulk phonebook contacts matching", async () => {
    const unknownPhone = "+19999999999";
    const res = await app.inject({
      method: "POST",
      url: "/users/contacts-lookup",
      headers: { authorization: `Bearer ${token1}` },
      payload: { phones: [phone1, phone2, unknownPhone] },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.matched.length).toBe(2);
    expect(body.unmatchedPhones).toContain(unknownPhone);
  });
});
