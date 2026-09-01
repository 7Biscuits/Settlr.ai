import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { env } from "../config/env.js";
import { transcribeAudio } from "../services/voiceService.js";

const transcribeSchema = z.object({
  // Base64-encoded audio payload (no data: prefix). Kept as JSON so the mobile
  // client's JSON-only fetch wrapper can call it without multipart handling.
  audioBase64: z.string().min(1),
  // Optional MIME type hint, e.g. "audio/m4a" (iOS) or "audio/webm".
  mimeType: z.string().min(1).optional(),
});

/**
 * Server-side voice proxy. Provider API keys (ElevenLabs) are kept on the
 * server and never exposed to clients.
 *
 * - POST /voice/transcribe: speech-to-text. Accepts a recorded clip and returns
 *   the transcript so the client can send it through the normal agent chat flow.
 * - POST /voice/tts: optional text-to-speech synthesis.
 */
export async function voiceRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", authenticate);

  app.post("/voice/transcribe", async (request, reply) => {
    // Validate the request shape first so malformed payloads get a 400
    // regardless of provider configuration.
    const { audioBase64, mimeType } = transcribeSchema.parse(request.body);
    if (!env.ELEVENLABS_API_KEY) {
      return reply.code(503).send({
        error: "STT not configured",
        message: "ELEVENLABS_API_KEY is not set",
      });
    }
    const text = await transcribeAudio(audioBase64, mimeType);
    return reply.send({ text });
  });

  app.post("/voice/tts", async (request, reply) => {
    if (!env.ELEVENLABS_API_KEY) {
      return reply
        .code(503)
        .send({ error: "TTS not configured", message: "ELEVENLABS_API_KEY is not set" });
    }
    const { text } = request.body as { text?: string };
    if (!text) {
      return reply.code(400).send({ error: "text is required" });
    }
    // Placeholder: real ElevenLabs synthesis would call their API here using
    // env.ELEVENLABS_API_KEY and stream audio back. Kept minimal for the demo.
    return reply.send({ ok: true });
  });
}
