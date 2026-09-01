import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { closeDatabase } from "../src/database/client.js";

/**
 * These tests require a running PostgreSQL (see docker-compose.yml) and applied
 * migrations. They are skipped automatically when DATABASE_URL is not set.
 */
const runDbTests = process.env.RUN_DB_TESTS === "1";
const d = runDbTests ? describe : describe.skip;

d("auth flow", () => {
  let app: FastifyInstance;
  const email = `test_${Date.now()}@example.com`;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeDatabase();
  });

  it("registers a new user and returns a token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email, name: "Test User", password: "password123" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(email);
    // Password hash must never be exposed.
    expect(body.user.passwordHash).toBeUndefined();
  });

  it("logs in with valid credentials and rejects invalid ones", async () => {
    const ok = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password: "password123" },
    });
    expect(ok.statusCode).toBe(200);
    const token = ok.json().token as string;

    const bad = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password: "wrong-password" },
    });
    expect(bad.statusCode).toBe(401);

    const me = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe(email);
  });

  it("rejects /auth/me without a token", async () => {
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
  });
});
