import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

/**
 * Voice endpoint tests. These do not touch the database: the transcribe route
 * validates auth and provider configuration before any persistence, so they
 * run without RUN_DB_TESTS. ELEVENLABS_API_KEY is unset in the test env, so the
 * route is expected to report the provider as unconfigured (503) rather than
 * calling out to a real provider.
 */
describe("voice routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated transcription requests", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/voice/transcribe",
      payload: { audioBase64: "AAAA" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("validates the request body for authenticated callers", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "t@e.com" });
    const res = await app.inject({
      method: "POST",
      url: "/voice/transcribe",
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("ValidationError");
  });

  it("reports 503 when the STT provider is not configured", async () => {
    const token = app.jwt.sign({ id: "00000000-0000-0000-0000-000000000000", email: "t@e.com" });
    const res = await app.inject({
      method: "POST",
      url: "/voice/transcribe",
      headers: { authorization: `Bearer ${token}` },
      payload: { audioBase64: "AAAA", mimeType: "audio/m4a" },
    });
    // Provider key is absent in the test environment.
    expect(res.statusCode).toBe(503);
  });
});
