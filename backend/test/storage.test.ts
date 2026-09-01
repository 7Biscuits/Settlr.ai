import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

describe("storage & receipt upload routes (unit / mock)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated upload requests", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/expenses/receipts/upload",
      payload: {
        imageBase64: "aGVsbG8gd29ybGQ=",
        mimeType: "image/jpeg",
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects invalid MIME types", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "u@e.com" });
    const res = await app.inject({
      method: "POST",
      url: "/expenses/receipts/upload",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        imageBase64: "aGVsbG8=",
        mimeType: "application/x-msdownload",
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("ValidationError");
  });

  it("rejects missing imageBase64 payload", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "u@e.com" });
    const res = await app.inject({
      method: "POST",
      url: "/expenses/receipts/upload",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        mimeType: "image/png",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 503 when Supabase credentials are unconfigured", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "u@e.com" });
    const res = await app.inject({
      method: "POST",
      url: "/expenses/receipts/upload",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        imageBase64: "aGVsbG8gd29ybGQ=",
        mimeType: "image/png",
      },
    });
    // In test env without SUPABASE_URL / KEY set, throws 503 AppError
    expect(res.statusCode).toBe(503);
    expect(res.json().message).toContain("Supabase Storage is not configured");
  });

  it("validates receipt attachment route schema", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "u@e.com" });
    const res = await app.inject({
      method: "POST",
      url: "/expenses/00000000-0000-0000-0000-000000000000/receipt",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        receiptUrl: "not-a-valid-url",
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("ValidationError");
  });
});
