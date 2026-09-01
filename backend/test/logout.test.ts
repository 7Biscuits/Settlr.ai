import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { closeDatabase } from "../src/database/client.js";

const runDbTests = process.env.RUN_DB_TESTS === "1";
const d = runDbTests ? describe : describe.skip;

describe("logout route (unit / mock)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated /auth/logout", async () => {
    const res = await app.inject({ method: "POST", url: "/auth/logout" });
    expect(res.statusCode).toBe(401);
  });
});

d("logout and token revocation (live DB)", () => {
  let app: FastifyInstance;
  const email = `test_logout_${Date.now()}@example.com`;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const reg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email, name: "Logout User", password: "password123" },
    });
    token = reg.json().token;
  });

  afterAll(async () => {
    await app.close();
    await closeDatabase();
  });

  it("allows access before logout", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it("logs out and revokes the token", async () => {
    const logoutRes = await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(logoutRes.statusCode).toBe(200);
    expect(logoutRes.json().success).toBe(true);

    // Subsequent access with the revoked token must be rejected with 401
    const resAfter = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(resAfter.statusCode).toBe(401);
    expect(resAfter.json().message).toContain("revoked");
  });
});
