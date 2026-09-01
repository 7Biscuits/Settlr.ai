import { env } from "../config/env.js";

type DeepgramTranscriptResponse = {
  results?: {
    channels?: Array<{ alternatives?: Array<{ transcript?: string }> }>;
  };
};

/**
 * Deepgram pre-recorded STT. Audio is supplied by the authenticated mobile app
 * but the Deepgram key stays exclusively on the backend.
 */
export async function transcribeAudio(
  audioBase64: string,
  mimeType = "audio/m4a",
): Promise<string> {
  assertDeepgramConfigured();
  const params = new URLSearchParams({
    model: env.DEEPGRAM_STT_MODEL,
    smart_format: "true",
    punctuate: "true",
  });
  const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
      "Content-Type": mimeType === "audio/m4a" ? "audio/mp4" : mimeType,
    },
    body: Buffer.from(audioBase64, "base64"),
  });
  if (!response.ok) {
    throw new Error(`Deepgram STT error ${response.status}: ${await response.text()}`);
  }

  const payload = (await response.json()) as DeepgramTranscriptResponse;
  return payload.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
}

/** Synthesizes a concise agent reply as MP3 using Deepgram Aura TTS. */
export async function synthesizeSpeech(text: string): Promise<{
  audioBase64: string;
  mimeType: "audio/mpeg";
}> {
  assertDeepgramConfigured();
  const params = new URLSearchParams({
    model: env.DEEPGRAM_TTS_MODEL,
    encoding: "mp3",
  });
  const response = await fetch(`https://api.deepgram.com/v1/speak?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error(`Deepgram TTS error ${response.status}: ${await response.text()}`);
  }
  return {
    audioBase64: Buffer.from(await response.arrayBuffer()).toString("base64"),
    mimeType: "audio/mpeg",
  };
}

function assertDeepgramConfigured(): void {
  if (!env.DEEPGRAM_API_KEY) {
    throw new Error("DEEPGRAM_API_KEY is not configured");
  }
}
