import { env } from "../config/env.js";

/**
 * Speech-to-text via ElevenLabs. The provider key never leaves the server.
 * The client uploads a recorded clip (base64) and receives only the transcript,
 * which it then sends through the normal agent chat flow. No LLM/STT provider
 * is ever contacted directly by the client.
 */
export async function transcribeAudio(
  audioBase64: string,
  mimeType = "audio/m4a",
): Promise<string> {
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const bytes = Buffer.from(audioBase64, "base64");
  const form = new FormData();
  const blob = new Blob([bytes], { type: mimeType });
  form.append("file", blob, filenameForMime(mimeType));
  form.append("model_id", "scribe_v1");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": env.ELEVENLABS_API_KEY,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs STT error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { text?: string };
  return json.text ?? "";
}

/** Maps a MIME type to a filename the STT API accepts. */
function filenameForMime(mimeType: string): string {
  if (mimeType.includes("webm")) return "audio.webm";
  if (mimeType.includes("wav")) return "audio.wav";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) return "audio.mp3";
  if (mimeType.includes("mp4")) return "audio.mp4";
  return "audio.m4a";
}
