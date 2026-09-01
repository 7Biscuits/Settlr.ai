import { apiFetch } from "./client";

/**
 * Sends a recorded audio clip to the backend for speech-to-text. The backend
 * holds the provider key and returns only the transcript; the client never
 * talks to an STT/LLM provider directly. Audio is sent base64-encoded so it
 * fits the app's JSON fetch wrapper.
 */
export function transcribe(
  audioBase64: string,
  mimeType?: string,
): Promise<{ text: string }> {
  return apiFetch<{ text: string }>("/voice/transcribe", {
    method: "POST",
    body: JSON.stringify({ audioBase64, mimeType }),
  });
}

/** Requests Deepgram-generated MP3 audio through the backend proxy. */
export function synthesize(text: string): Promise<{
  audioBase64: string;
  mimeType: "audio/mpeg";
}> {
  return apiFetch<{ audioBase64: string; mimeType: "audio/mpeg" }>(
    "/voice/tts",
    {
      method: "POST",
      body: JSON.stringify({ text }),
    },
  );
}
