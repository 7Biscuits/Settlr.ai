import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { env } from "../config/env.js";
import { synthesizeSpeech, transcribeAudio } from "../services/voiceService.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const MAX_AUDIO_BASE64_CHARS = 700_000;

const transcribeSchema = z.object({
  // Base64-encoded audio payload (no data: prefix). Kept as JSON so the mobile
  // client's JSON-only fetch wrapper can call it without multipart handling.
  audioBase64: z
    .string()
    .min(1)
    .max(MAX_AUDIO_BASE64_CHARS)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, "audioBase64 must be valid base64"),
  // Optional MIME type hint, e.g. "audio/m4a" (iOS) or "audio/webm".
  mimeType: z
    .enum(["audio/m4a", "audio/mp4", "audio/mpeg", "audio/wav", "audio/webm"])
    .optional(),
});

const ttsSchema = z.object({
  text: z.string().trim().min(1).max(1_000),
});

const voiceRateLimit = createRateLimiter({ max: 10, windowMs: 60_000 });

/**
 * Server-side voice proxy. The Deepgram key is kept on the
 * server and never exposed to clients.
 *
 * - POST /voice/transcribe: speech-to-text. Accepts a recorded clip and returns
 *   the transcript so the client can send it through the normal agent chat flow.
 * - POST /voice/tts: Deepgram text-to-speech synthesis as MP3 base64.
 */
export async function voiceRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.post("/voice/transcribe", { preHandler: voiceRateLimit }, async (request, reply) => {
    // Validate the request shape first so malformed payloads get a 400
    // regardless of provider configuration.
    const { audioBase64, mimeType } = transcribeSchema.parse(request.body);
    if (!env.DEEPGRAM_API_KEY) {
      return reply.code(503).send({
        error: "STT not configured",
        message: "DEEPGRAM_API_KEY is not set",
      });
    }
    const text = await transcribeAudio(audioBase64, mimeType);
    return reply.send({ text });
  });

  app.post("/voice/tts", { preHandler: voiceRateLimit }, async (request, reply) => {
    if (!env.DEEPGRAM_API_KEY) {
      return reply
        .code(503)
        .send({ error: "TTS not configured", message: "DEEPGRAM_API_KEY is not set" });
    }
    const { text } = ttsSchema.parse(request.body);
    return reply.send(await synthesizeSpeech(text));
  });
}
