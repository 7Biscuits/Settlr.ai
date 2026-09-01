import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { closeDatabase } from "../src/database/client.js";

const runDbTests = process.env.RUN_DB_TESTS === "1";
const d = runDbTests ? describe : describe.skip;

describe("messaging routes (unit / mock)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated conversations request", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/conversations",
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects unauthenticated message send", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/messages",
      payload: {
        recipientId: "00000000-0000-0000-0000-000000000000",
        content: "Hello",
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it("validates empty content on send", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "u@e.com" });
    const res = await app.inject({
      method: "POST",
      url: "/messages",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        recipientId: "00000000-0000-0000-0000-000000000000",
        content: "   ",
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("ValidationError");
  });

  it("validates missing recipient on conversation creation", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "u@e.com" });
    const res = await app.inject({
      method: "POST",
      url: "/conversations",
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

d("direct messaging lifecycle (live DB)", () => {
  let app: FastifyInstance;
  const aliceEmail = `alice_msg_${Date.now()}@example.com`;
  const bobEmail = `bob_msg_${Date.now()}@example.com`;
  const charlieEmail = `charlie_msg_${Date.now()}@example.com`;
  const alicePhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;
  const bobPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;

  let aliceToken: string;
  let bobToken: string;
  let charlieToken: string;
  let aliceId: string;
  let bobId: string;
  let charlieId: string;
  let conversationId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Register Alice
    const regAlice = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: aliceEmail, name: "Alice Msg", password: "password123", phone: alicePhone },
    });
    aliceToken = regAlice.json().token;
    aliceId = regAlice.json().user.id;

    // Register Bob
    const regBob = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: bobEmail, name: "Bob Msg", password: "password123", phone: bobPhone },
    });
    bobToken = regBob.json().token;
    bobId = regBob.json().user.id;

    // Register Charlie (unauthorized third-party)
    const regCharlie = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: charlieEmail, name: "Charlie Msg", password: "password123" },
    });
    charlieToken = regCharlie.json().token;
    charlieId = regCharlie.json().user.id;
  });

  afterAll(async () => {
    await app.close();
    await closeDatabase();
  });

  it("starts a conversation between Alice and Bob", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/conversations",
      headers: { authorization: `Bearer ${aliceToken}` },
      payload: { recipientId: bobId },
    });
    expect(res.statusCode).toBe(201);
    conversationId = res.json().conversation.id;
    expect(res.json().otherParticipant.name).toBe("Bob Msg");
  });

  it("Alice sends a text message and a payment request to Bob", async () => {
    // Message 1: Text
    const msg1Res = await app.inject({
      method: "POST",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${aliceToken}` },
      payload: {
        content: "Hey Bob, could you send the dinner split?",
        messageType: "text",
      },
    });
    expect(msg1Res.statusCode).toBe(201);
    expect(msg1Res.json().message.content).toBe("Hey Bob, could you send the dinner split?");
    expect(msg1Res.json().message.isRead).toBe(false);

    // Message 2: Payment request
    const msg2Res = await app.inject({
      method: "POST",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${aliceToken}` },
      payload: {
        content: "Dinner Share: $25.00",
        messageType: "payment_request",
        metadata: { amount: 2500, note: "Dinner share" },
      },
    });
    expect(msg2Res.statusCode).toBe(201);
    expect(msg2Res.json().message.messageType).toBe("payment_request");
  });

  it("Bob sees 2 unread messages and lists conversation", async () => {
    const unreadRes = await app.inject({
      method: "GET",
      url: "/messages/unread-count",
      headers: { authorization: `Bearer ${bobToken}` },
    });
    expect(unreadRes.statusCode).toBe(200);
    expect(unreadRes.json().unreadCount).toBe(2);

    const convsRes = await app.inject({
      method: "GET",
      url: "/conversations",
      headers: { authorization: `Bearer ${bobToken}` },
    });
    expect(convsRes.statusCode).toBe(200);
    const convs = convsRes.json().conversations;
    expect(convs.length).toBe(1);
    expect(convs[0].unreadCount).toBe(2);
    expect(convs[0].otherParticipant.name).toBe("Alice Msg");
  });

  it("Bob reads messages and unread count resets to 0", async () => {
    // List messages
    const listRes = await app.inject({
      method: "GET",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${bobToken}` },
    });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json().messages.length).toBe(2);

    // Mark as read
    const readRes = await app.inject({
      method: "POST",
      url: `/conversations/${conversationId}/read`,
      headers: { authorization: `Bearer ${bobToken}` },
    });
    expect(readRes.statusCode).toBe(200);
    expect(readRes.json().markedCount).toBe(2);

    // Verify unread count is now 0
    const unreadCheck = await app.inject({
      method: "GET",
      url: "/messages/unread-count",
      headers: { authorization: `Bearer ${bobToken}` },
    });
    expect(unreadCheck.json().unreadCount).toBe(0);
  });

  it("Alice quick-sends a message using Bob's phone number", async () => {
    const quickRes = await app.inject({
      method: "POST",
      url: "/messages",
      headers: { authorization: `Bearer ${aliceToken}` },
      payload: {
        phone: bobPhone,
        content: "Got your transfer, thanks!",
        messageType: "text",
      },
    });
    expect(quickRes.statusCode).toBe(201);
    expect(quickRes.json().conversationId).toBe(conversationId);
  });

  it("Charlie is forbidden from reading Alice & Bob's conversation", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${charlieToken}` },
    });
    expect(res.statusCode).toBe(403);
  });
});
