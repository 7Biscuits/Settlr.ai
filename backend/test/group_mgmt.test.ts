import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { closeDatabase } from "../src/database/client.js";

const runDbTests = process.env.RUN_DB_TESTS === "1";
const d = runDbTests ? describe : describe.skip;

describe("group management routes (unit / mock)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated group creation", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/groups",
      payload: { name: "Test Group" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects unauthenticated group update", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/groups/00000000-0000-0000-0000-000000000000",
      payload: { name: "Renamed Group" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects unauthenticated group deletion", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/groups/00000000-0000-0000-0000-000000000000",
    });
    expect(res.statusCode).toBe(401);
  });

  it("validates group update payload schema", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "u@e.com" });
    const res = await app.inject({
      method: "PATCH",
      url: "/groups/00000000-0000-0000-0000-000000000000",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "" }, // empty name invalid
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("ValidationError");
  });
});

d("group lifecycle (create, update, delete) (live DB)", () => {
  let app: FastifyInstance;
  const ownerEmail = `owner_${Date.now()}@example.com`;
  const memberEmail = `member_${Date.now()}@example.com`;
  let ownerToken: string;
  let memberToken: string;
  let groupId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register owner
    const regOwner = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: ownerEmail, name: "Owner", password: "password123" },
    });
    ownerToken = regOwner.json().token;

    // Register non-owner member
    const regMember = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: memberEmail, name: "Member", password: "password123" },
    });
    memberToken = regMember.json().token;

    // Owner creates group
    const groupRes = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { name: "Initial Trip" },
    });
    expect(groupRes.statusCode).toBe(201);
    groupId = groupRes.json().group.id;

    // Add member to group
    await app.inject({
      method: "POST",
      url: `/groups/${groupId}/members`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { email: memberEmail },
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDatabase();
  });

  it("allows owner to update group name", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/groups/${groupId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { name: "Updated Trip Name" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().group.name).toBe("Updated Trip Name");
  });

  it("forbids non-owner from updating group name", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/groups/${groupId}`,
      headers: { authorization: `Bearer ${memberToken}` },
      payload: { name: "Hacked Trip Name" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("forbids non-owner from deleting group", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/groups/${groupId}`,
      headers: { authorization: `Bearer ${memberToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("allows owner to delete group when debts are settled", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/groups/${groupId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    expect(res.statusCode).toBe(204);

    // Assert group is gone
    const checkRes = await app.inject({
      method: "GET",
      url: `/groups/${groupId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    expect(checkRes.statusCode).toBe(403); // No longer member/exists
  });
});
